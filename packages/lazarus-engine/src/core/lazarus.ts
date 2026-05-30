import { Page } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import { Annotator } from "../vision/annotator";
import { AICaller } from "../vision/ai";
import { CodeRewriter } from "../ast/rewriter";
import { TelemetryLogger } from "../telemetry/logger";

export interface LazyHealingOptions {
  ollama?: {
    apiUrl?: string;
    model?: string;
    allowFastMatch?: boolean;
  };
  supabase?: {
    url?: string;
    anonKey?: string;
  };
  scriptId?: string;
  projectId?: string;
  projectName?: string;
  scriptName?: string;
  scriptFilePath?: string;
  enableTelemetry?: boolean;
}

/**
 * Lazarus - Self-healing Playwright wrapper
 * Wraps Playwright Page methods and automatically fixes selectors when elements are not found
 */
export class Lazarus {
  private page: Page;
  private annotator: Annotator;
  private aiCaller: AICaller;
  private rewriter: CodeRewriter;
  private telemetry: TelemetryLogger;
  private options: LazyHealingOptions;

  constructor(page: Page, options: LazyHealingOptions = {}) {
    this.page = page;
    this.options = options;
    this.annotator = new Annotator(page);
    this.aiCaller = new AICaller(options.ollama);
    this.rewriter = new CodeRewriter();
    this.telemetry = new TelemetryLogger({
      ...options.supabase,
      projectId: options.projectId,
      projectName: options.projectName,
      scriptId: options.scriptId,
      scriptName: options.scriptName,
      scriptFilePath: options.scriptFilePath,
    });
  }

  /**
   * Attempts to click an element. If it fails, uses vision to find the correct selector
   */
  async click(targetDescription: string, fallbackSelector: string): Promise<void> {
    try {
      await this.page.click(fallbackSelector, { timeout: 1500 });
    } catch (error: any) {
      if (error.message?.includes("Timeout")) {
        console.log(`[Lazarus] Element not found. Initiating self-healing for: "${targetDescription}"`);
        
        // Extract stack trace info
        const stackInfo = this.captureCallSite() || this.parseStackTrace(error.stack || "");
        
        // Inject vision boxes
        const { selectorMap, metadataMap } = await this.annotator.annotateDOM();
        
        // Take screenshot and convert to base64
        const screenshotBuffer = await this.page.screenshot({
          type: "jpeg",
          quality: 80,
          fullPage: false,
          animations: "disabled",
        });
        const screenshot = screenshotBuffer.toString("base64");
        
        // Query AI for the correct element
        const newSelector = await this.aiCaller.identifyElement(
          targetDescription,
          selectorMap,
          metadataMap,
          screenshot
        );
        
        // Rewrite the source code
        if (stackInfo.file && stackInfo.line) {
          try {
            await this.rewriter.replaceSelector(
              stackInfo.file,
              stackInfo.line,
              fallbackSelector,
              newSelector
            );
          } catch (rewriteError) {
            console.warn("[Lazarus] Code rewrite failed:", rewriteError);
          }
        }
        
        // Log telemetry
        await this.telemetry.logHealing({
          scriptId: this.options.scriptId || stackInfo.file || "unknown",
          targetDescription,
          oldSelector: fallbackSelector,
          newSelector,
          screenshotBase64: screenshot,
          status: "HEALED",
        });
        
        // Try clicking with new selector
       try {
            await this.page.click(newSelector, { timeout: 3000 });
        } catch (retryError) {
            console.error(`[Lazarus] Healed selector ${newSelector} also failed. Aborting.`);
            throw new Error(`Self-healing failed. Original target: '${fallbackSelector}'. AI suggested: '${newSelector}', but it was unclickable.`);
        }


      } else {
        throw error;
      }
    }
  }

 
 
 /**
   * Parse error stack trace to extract file and line number
   */
  private captureCallSite(): { file: string | null; line: number | null } {
    const originalPrepare = Error.prepareStackTrace;

    try {
      Error.prepareStackTrace = (_, stack) => stack;

      const error = new Error();
      Error.captureStackTrace(error, this.click);
      const stack = error.stack as unknown as NodeJS.CallSite[] | undefined;

      if (!Array.isArray(stack)) {
        return { file: null, line: null };
      }

      for (const callsite of stack) {
        const rawFile = callsite.getFileName() || callsite.getScriptNameOrSourceURL();
        const line = callsite.getLineNumber();

        if (!rawFile || !line) continue;

        let file = rawFile;
        if (file.startsWith("file:")) {
          try {
            file = fileURLToPath(file);
          } catch {
            file = file.replace(/^file:\/\/+/, "");
          }
        }

        // BULLETPROOF FILTERING
        const isNodeInternal = file.startsWith("node:") || file.includes("internal/");
        const isDependencyFrame = file.includes(`${path.sep}node_modules${path.sep}`);
        const isEngineFrame = file.includes(`${path.sep}packages${path.sep}lazarus-engine${path.sep}src${path.sep}`);

        if (!isNodeInternal && !isDependencyFrame && !isEngineFrame) {
          // Verify the file actually exists on disk before returning it
          import("fs").then(fs => {
            if (!fs.existsSync(file)) return null;
          });
          return { file, line };
        }
      }

      return { file: null, line: null };
    } finally {
      Error.prepareStackTrace = originalPrepare;
    }
  }

  private parseStackTrace(stack: string): { file: string | null; line: number | null } {
    const lines = stack.split("\n");
    for (const line of lines) {
      const normalizedLine = line
        .trim()
        .replace(/^at\s+[^(]+\(/, "")
        .replace(/^at\s+/, "")
        .replace(/\)$/, "");

      // Ignore standard internals
      if (normalizedLine.startsWith("node:") || normalizedLine.includes("internal/")) continue;

      const match = normalizedLine.match(/^(.*):(\d+):(\d+)$/);

      if (match) {
        let file = match[1];

        if (file.startsWith("file:")) {
          try {
            file = fileURLToPath(file);
          } catch {
            file = file.replace(/^file:\/\/+/, "");
          }
        }

        const isNodeInternal = file.startsWith("node:") || file.includes("internal/");
        const isDependencyFrame = file.includes(`${path.sep}node_modules${path.sep}`);
        const isEngineFrame = file.includes(`${path.sep}packages${path.sep}lazarus-engine${path.sep}src${path.sep}`);

        if (!isNodeInternal && !isDependencyFrame && !isEngineFrame) {
          return { file, line: parseInt(match[2]) };
        }
      }
    }
    return { file: null, line: null };
  }
}

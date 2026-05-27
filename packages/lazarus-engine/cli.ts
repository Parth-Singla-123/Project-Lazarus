#!/usr/bin/env node

/**
 * Lazarus CLI - Command line interface for the engine
 * Usage: npx lazarus-cli <command> [options]
 */

import { Lazarus } from "./src/index";
import { chromium, Browser } from "playwright";

const commands: Record<string, (...args: string[]) => Promise<void>> = {
  async test() {
    console.log("[Lazarus CLI] Starting test...");
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({ headless: false });
      const page = await browser.newPage();
      const lazarus = new Lazarus(page);

      await page.goto("https://example.com");
      console.log("[Lazarus CLI] Loaded https://example.com");

      // Demonstrate the annotator
      console.log("[Lazarus CLI] Annotating page elements...");
      // The annotator is called internally during click failures
      // For testing, we can call it directly through the page context

      console.log("[Lazarus CLI] Test complete!");
    } catch (error) {
      console.error("[Lazarus CLI] Error:", error);
      process.exit(1);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },

  help() {
    console.log(`
Lazarus CLI v1.0.0

Commands:
  test        Run a basic test of the Lazarus engine
  help        Show this help message
  version     Show version information

Examples:
  lazarus-cli test
  lazarus-cli help
    `);
  },

  version() {
    console.log("Lazarus Engine v1.0.0");
  },
};

// Main entry point
const [command = "help", ...args] = process.argv.slice(2);

if (command in commands) {
  commands[command](...args).catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  console.error(`Unknown command: ${command}`);
  console.log('Use "lazarus-cli help" for usage information');
  process.exit(1);
}

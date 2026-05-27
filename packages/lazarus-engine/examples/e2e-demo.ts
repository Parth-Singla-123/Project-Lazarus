/**
 * End-to-end self-healing demo.
 *
 * What this does:
 * - Starts a mock Ollama endpoint
 * - Opens a local page with buttons that can be matched by metadata or model output
 * - Calls Lazarus with a broken selector so the heal path is exercised
 * - Lets Lazarus heal, rewrite this file, and log telemetry
 */

const http: typeof import("http") = require("http");
const fs: typeof import("fs") = require("fs");
const path: typeof import("path") = require("path");
const { chromium } = require("playwright");
const { Lazarus } = require("../src/index");

function loadDashboardEnv(): Record<string, string> {
  const envPath = path.resolve(__dirname, "../../../apps/dashboard/.env.local");
  const content = fs.readFileSync(envPath, "utf8");
  const env: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

async function startMockOllama(): Promise<{ server: import("http").Server; url: string }> {
  const server = http.createServer((req: import("http").IncomingMessage, res: import("http").ServerResponse) => {
    if (req.method === "POST" && req.url === "/api/generate") {
      let body = "";
      req.on("data", (chunk: Buffer) => {
        body += chunk;
      });
      req.on("end", () => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ response: "1" }));
      });
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
  });

  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to start mock Ollama server");
  }

  return { server, url: `http://127.0.0.1:${address.port}/api/generate` };
}

async function main() {
  const env = loadDashboardEnv();
  const mockOllama = await startMockOllama();
  const demoMode = (process.env.LAZARUS_DEMO_MODE || "vision").toLowerCase();
  const allowFastMatch = demoMode !== "vision";
  let browser: import("playwright").Browser | undefined = undefined;

  try {
    const launchedBrowser = await chromium.launch({ headless: true });
    browser = launchedBrowser;
    const page = await launchedBrowser.newPage();

    console.log(`[E2E] Mode: ${demoMode}`);
    console.log(`[E2E] Fast match enabled: ${allowFastMatch}`);

    await page.setContent(`
      <!doctype html>
      <html>
        <body style="font-family: sans-serif; padding: 24px; background: #111; color: #fff;">
          <button id="real-submit-btn" aria-label="Submit primary action" style="padding: 12px 18px; background: #16a34a; color: white; border: 0; border-radius: 8px;">Submit</button>
          <button id="secondary-btn" aria-label="Secondary action" style="margin-left: 12px; padding: 12px 18px; background: #334155; color: white; border: 0; border-radius: 8px;">Cancel</button>
          <div id="status" style="margin-top: 16px;">Waiting...</div>
          <script>
            document.getElementById('real-submit-btn').addEventListener('click', () => {
              document.getElementById('status').textContent = 'Clicked via healed selector';
            });
          </script>
        </body>
      </html>
    `);

    const lazarus = new Lazarus(page, {
      ollama: { apiUrl: mockOllama.url, model: "moondream", allowFastMatch },
      scriptId: "22222222-2222-2222-2222-222222222222",
      supabase: env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? {
            url: env.NEXT_PUBLIC_SUPABASE_URL,
            anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          }
        : undefined,
      enableTelemetry: true,
    });

    const brokenSelector = ["#broken", "submit", "-btn"].join("");

    console.log("[E2E] Triggering broken click...");
    await lazarus.click("Submit primary action", brokenSelector);

    const status = await page.textContent("#status");
    console.log("[E2E] Status:", status);
    console.log("[E2E] Demo complete.");
  } finally {
    if (browser) {
      await browser.close();
    }

    await new Promise<void>((resolve) => mockOllama.server.close(() => resolve()));
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[E2E] Failed:", error);
    process.exit(1);
  });
}

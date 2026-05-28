/**
 * End-to-end self-healing demo (REAL AI VISION MODE).
 */
import * as fs from "fs";
import * as path from "path";
import { chromium, Browser } from "playwright";
import { Lazarus } from "../src/index";

// 1. Load Supabase Environment Variables
function loadDashboardEnv(): Record<string, string> {
  const envPath = path.resolve(__dirname, "../../../apps/dashboard/.env.local");
  try {
    const content = fs.readFileSync(envPath, "utf8");
    const env: Record<string, string> = {};
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) continue;
      env[trimmed.slice(0, equalsIndex).trim()] = trimmed.slice(equalsIndex + 1).trim();
    }
    return env;
  } catch (e) {
    console.warn("[E2E] Could not load .env.local, telemetry might fail.");
    return {};
  }
}

// 2. Main Execution
async function main() {
  const env = loadDashboardEnv();
  let browser: Browser | undefined;

  try {
    // CHANGED: headless: false so you can watch the red boxes get drawn
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    console.log("[E2E] Mode: REAL VISION AI");

    // Load a dummy DOM
    await page.setContent(`
      <!doctype html>
      <html>
        <body style="padding: 24px; background: #111; color: #fff;">
          <button id="real-submit-btn" aria-label="Submit primary action" style="background: #16a34a; padding: 10px;">Submit</button>
          <button id="secondary-btn" aria-label="Secondary action" style="background: #444; padding: 10px; margin-left: 10px;">Cancel</button>
          <div id="status" style="margin-top: 20px;">Waiting...</div>
          <script>
            document.getElementById('real-submit-btn').addEventListener('click', () => {
              document.getElementById('status').textContent = 'Clicked via healed selector';
            });
          </script>
        </body>
      </html>
    `);

    const lazarus = new Lazarus(page, {
      ollama: { 
        apiUrl: "http://localhost:11434/api/generate", // CHANGED: Connect to real local Ollama
        model: "moondream", 
        allowFastMatch: false // CHANGED: Force it to use the Vision AI, not text heuristics
      },
      scriptId: "22222222-2222-2222-2222-222222222222",
      supabase: env.NEXT_PUBLIC_SUPABASE_URL ? {
        url: env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      } : undefined,
      enableTelemetry: true,
    });

    console.log("[E2E] Triggering broken click...");
    
    // Attempt to click a broken selector
    await lazarus.click("Submit primary action", "#broken-submit-btn");

    const status = await page.textContent("#status");
    console.log("[E2E] Status:", status);
    console.log("[E2E] Demo complete.");
    
    // Pause for 3 seconds so you can see the success before the browser closes
    await page.waitForTimeout(3000); 

  } finally {
    if (browser) await browser.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[E2E] Failed:", error);
    process.exit(1);
  });
}
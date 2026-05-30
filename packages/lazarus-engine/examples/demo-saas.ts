/**
 * MASSIVE DEMO 2: Enterprise SaaS Settings
 * Demonstrates Lazarus finding a critical action button hidden in a cluttered UI.
 */
import { chromium } from "playwright";
import { Lazarus } from "../src/index";
import * as fs from "fs";
import * as path from "path";

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


async function main() {
  console.log("🚀 [Demo 2] Starting SaaS Settings Flow...");
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const env = loadDashboardEnv();
  const page = await browser.newPage();

  await page.setContent(`
    <!doctype html>
    <html lang="en">
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #cbd5e1; margin: 0; display: flex;}
          .sidebar { width: 250px; background: #1e293b; height: 100vh; padding: 20px; border-right: 1px solid #334155; }
          .content { flex: 1; padding: 40px; max-width: 900px; margin: 0 auto; }
          .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
          .input-group { margin-bottom: 16px; }
          .input-group label { display: block; margin-bottom: 8px; font-size: 14px; color: #94a3b8; }
          .input-group input { width: 100%; padding: 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: white; }
          
          /* The Danger Zone */
          .danger-zone { border: 1px solid #7f1d1d; background: #450a0a; border-radius: 12px; padding: 24px; margin-top: 40px; }
          .danger-btn { background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-block; }
          
          .btn-normal { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="sidebar">
          <h2 style="color: white; margin-bottom: 40px;">DataDog Clone</h2>
          <p>📊 Dashboard</p><p>📈 Metrics</p><p>👥 Team</p><p style="color: #3b82f6;">⚙️ Settings</p>
        </div>

        <div class="content">
          <h1 style="color: white;">Account Settings</h1>
          
          <div class="card">
            <h2 style="color: white; font-size: 18px; margin-top: 0;">Profile Information</h2>
            <div class="input-group"><label>Full Name</label><input type="text" value="Staff Engineer"></div>
            <div class="input-group"><label>Email Address</label><input type="email" value="engineer@company.com"></div>
            <button class="btn-normal">Save Profile</button>
          </div>

          <div class="danger-zone">
            <h2 style="color: #fca5a5; font-size: 18px; margin-top: 0;">Danger Zone</h2>
            <p style="color: #fecaca; font-size: 14px;">Once you delete your organization, there is no going back. Please be certain.</p>
            
            <!-- TARGET BUTTON -->
            <button class="danger-btn" role="button" aria-label="Permanently delete account">
              Delete Organization
            </button>
          </div>
        </div>

        <div id="toast" style="display: none; position: fixed; bottom: 40px; right: 40px; background: #ef4444; color: white; padding: 16px 24px; border-radius: 8px; font-weight: bold; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          🚨 ORGANIZATION DELETED
        </div>

        <script>
          document.querySelector('.danger-btn').addEventListener('click', () => {
            document.getElementById('toast').style.display = 'block';
          });
        </script>
      </body>
    </html>
  `);

  const lazarus = new Lazarus(page, {
    ollama: { apiUrl: "http://localhost:11434/api/generate", model: "llava", allowFastMatch: false },
    scriptId: "demo-saas-settings",
    projectName: "DataDog Clone SaaS Settings Demo",
    scriptName: "SaaS Settings Flow",
    scriptFilePath: "packages/lazarus-engine/examples/demo-saas.ts",
    supabase: env.NEXT_PUBLIC_SUPABASE_URL ? {
      url: env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    } : undefined,
    enableTelemetry: true,
  });

  console.log("🚨 Attempting to click legacy delete button...");
  
  // The Broken Script
  await lazarus.click("Delete Organization Button", "#legacy-btn-123");

  await page.waitForTimeout(4000);
  await browser.close();
}

main().catch(console.error);
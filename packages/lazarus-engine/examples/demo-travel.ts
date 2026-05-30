/**
 * MASSIVE DEMO 3: The Airline Booking Portal (Multi-Heal)
 * Demonstrates Lazarus healing multiple consecutive broken selectors in a single test run.
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
    return {};
  }
}

async function main() {
  const env = loadDashboardEnv();
  let browser: Browser | undefined;

  try {
    console.log("🚀 [Demo 3] Starting Airline Booking Flow...");
    
    // Headless: false to watch the AI draw boxes twice
    browser = await chromium.launch({ headless: false, slowMo: 500 });
    const page = await browser.newPage();

    // A highly cluttered, modern Flexbox/Grid DOM
    await page.setContent(`
      <!doctype html>
      <html lang="en">
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #e0e7ff; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh;}
            .container { background: white; width: 1000px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; }
            .header { background: #1e3a8a; color: white; padding: 20px 40px; display: flex; justify-content: space-between; }
            .tabs { display: flex; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; }
            .tab { padding: 15px 30px; font-weight: 600; color: #475569; cursor: pointer; }
            .tab.active { background: white; color: #1e3a8a; border-bottom: 3px solid #1e3a8a; }
            .booking-area { padding: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .input-box { border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; width: 100%; box-sizing: border-box; }
            
            /* Ticket Type Selectors (Mutated to generic pills instead of radio buttons) */
            .ticket-types { display: flex; gap: 10px; grid-column: span 2; margin-bottom: 20px; }
            .pill { padding: 8px 16px; background: #f1f5f9; border-radius: 9999px; cursor: pointer; border: 1px solid #cbd5e1; }
            .pill.selected { background: #dbeafe; border-color: #3b82f6; color: #1d4ed8; font-weight: bold; }

            /* Action Buttons (Cluttered deliberately to confuse the AI) */
            .actions { grid-column: span 2; display: flex; justify-content: flex-end; gap: 15px; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            .btn-secondary { background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
            .btn-primary { background: #2563eb; color: white; border: none; padding: 12px 32px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 16px; }
            
            /* Status Log */
            #system-log { grid-column: span 2; margin-top: 20px; padding: 15px; background: #ecfdf5; color: #065f46; border-radius: 8px; display: none; font-weight: bold;}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>SkyHigh Airlines</h2>
              <div>Miles: 45,200 | Sign Out</div>
            </div>
            
            <div class="tabs">
              <div class="tab active">✈️ Flights</div>
              <div class="tab">🏨 Hotels</div>
              <div class="tab">🚗 Rental Cars</div>
            </div>

            <div class="booking-area">
              <!-- MUTATION 1: Used to be <input type="radio" id="one-way"> -->
              <div class="ticket-types">
                <div class="pill selected" id="opt-round" role="button">Round Trip</div>
                <div class="pill" id="opt-one-way" role="button">One Way Ticket</div>
                <div class="pill" id="opt-multi" role="button">Multi-City</div>
            </div>

              <div><label>From</label><input type="text" class="input-box" value="New York (JFK)"></div>
              <div><label>To</label><input type="text" class="input-box" value="London (LHR)"></div>
              
              <div class="actions">
                <button class="btn-secondary">Search Hotels Instead</button>
                <button class="btn-secondary">Clear Fields</button>
                <!-- MUTATION 2: Used to be <button id="submit-flight-search"> -->
                <button class="btn-primary" id="final-search-action">Search Flights</button>
              </div>

              <div id="system-log">System: Booking flow initiated successfully.</div>
            </div>
          </div>

          <script>
            // Logic for the test
            document.getElementById('opt-one-way').addEventListener('click', function() {
              document.querySelectorAll('.pill').forEach(p => p.classList.remove('selected'));
              this.classList.add('selected');
            });

            document.getElementById('final-search-action').addEventListener('click', function() {
              if (document.getElementById('opt-one-way').classList.contains('selected')) {
                document.getElementById('system-log').style.display = 'block';
                document.getElementById('system-log').innerText = "SUCCESS: Searching One-Way Flights to London!";
              }
            });
          </script>
        </body>
      </html>
    `);

    // Initialize Lazarus (Forced Vision AI)
    const lazarus = new Lazarus(page, {
      ollama: { apiUrl: "http://localhost:11434/api/generate", model: "llava", allowFastMatch: false },
      scriptId: "demo-travel-booking",
      supabase: env.NEXT_PUBLIC_SUPABASE_URL ? {
        url: env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      } : undefined,
      enableTelemetry: true,
    });

    console.log("🚨 [Action 1] Attempting to click legacy 'One Way' radio button...");
    
    // HEAL NUMBER 1
    // Watch this string rewrite itself while the script is running!
    await lazarus.click("One Way Ticket option pill", "#opt-one-way");
    
    console.log("✅ [Action 1] Success. Moving to next step.");

    // Small delay to simulate user flow
    await page.waitForTimeout(1000);

    console.log("🚨 [Action 2] Attempting to click legacy 'Search Flights' button...");
    
    // HEAL NUMBER 2
    // Because the file didn't gain/lose newlines, AST knows exactly where this line is!
    await lazarus.click("Search Flights button (Blue)", "#submit-flight-search-old");

    console.log("✅ [Action 2] Success.");

    // Keep browser open to show the green success banner
    await page.waitForTimeout(4000);

  } finally {
    if (browser) await browser.close();
    console.log("🏁 Demo complete.");
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[E2E] Failed:", error);
    process.exit(1);
  });
}
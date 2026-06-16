/**
 * DEMO: The Enterprise FinTech Dashboard
 * Demonstrates Lazarus healing two distinct, uniquely named buttons in a complex, 
 * modern SaaS layout (simulating a React/Tailwind frontend).
 */
import * as fs from "fs";
import * as path from "path";
import { chromium, Browser } from "playwright";
import { Lazarus } from "../src/index";

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
  } catch (e) { return {}; }
}

async function main() {
  const env = loadDashboardEnv();
  let browser: Browser | undefined;

  try {
    console.log("🚀 [Demo] Starting Enterprise FinTech Flow...");
    browser = await chromium.launch({ headless: false, slowMo: 500 });
    const page = await browser.newPage();

    // A beautiful, highly polished Stripe-like Dashboard
    await page.setContent(`
      <!doctype html>
      <html lang="en">
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; margin: 0; display: flex; color: #0f172a; height: 100vh;}
            
            /* Sidebar */
            .sidebar { width: 260px; background: white; height: 100vh; border-right: 1px solid #e2e8f0; padding: 24px; display: flex; flex-direction: column; box-sizing: border-box; }
            .brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 32px; }
            .brand-logo { width: 28px; height: 28px; background: #6366f1; border-radius: 8px; }
            .nav-item { padding: 10px 14px; margin-bottom: 4px; color: #64748b; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px; transition: 0.2s;}
            .nav-item:hover { background: #f1f5f9; color: #0f172a; }
            .nav-item.active { background: #eef2ff; color: #4f46e5; font-weight: 600; }
            
            /* Sidebar Footer (The New Button Area) */
            .sidebar-footer { margin-top: auto; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
            .pro-title { font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
            .pro-desc { font-size: 12px; color: #64748b; margin: 0 0 12px 0; line-height: 1.4; }
            .btn-upgrade { width: 100%; background: #0f172a; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; transition: 0.2s; }
            .btn-upgrade:hover { background: #334155; }
            
            /* Main Content */
            .main-content { flex: 1; padding: 40px 56px; overflow-y: auto; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
            .header-actions { display: flex; gap: 12px; }
            
            /* Stats */
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 32px; }
            .stat-card { background: white; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
            .stat-value { font-size: 32px; font-weight: 700; color: #0f172a; margin-top: 8px; letter-spacing: -0.5px; }
            .stat-trend { font-size: 13px; color: #10b981; font-weight: 500; margin-top: 8px; display: flex; align-items: center; gap: 4px;}
            
            /* Table */
            .table-container { background: white; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow: hidden; }
            .data-table { width: 100%; border-spacing: 0; }
            .data-table th { background: #f8fafc; padding: 14px 24px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
            .data-table td { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; font-weight: 500;}
            .status-badge { padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
            .status-success { background: #dcfce7; color: #166534; }
            .status-failed { background: #fee2e2; color: #991b1b; }
            
            /* Buttons */
            .btn-outline { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; transition: 0.2s; }
            .btn-outline:hover { background: #f8fafc; color: #0f172a; }
            .action-generate-report { background: #6366f1; border: none; color: white; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; transition: 0.2s; box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2); }
            .action-generate-report:hover { background: #4f46e5; }
            
            /* Notifications */
            #toast-container { position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 12px; z-index: 999; }
            .toast { display: none; background: #10b981; color: white; padding: 16px 24px; border-radius: 12px; font-weight: 600; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15); border: 1px solid #059669; }
            .toast.pro { background: #0f172a; border-color: #334155; }
          </style>
        </head>
        <body>
          <div class="sidebar">
            <div class="brand"><div class="brand-logo"></div> PayFlow</div>
            <div class="nav-item">Home</div>
            <div class="nav-item active">Payments</div>
            <div class="nav-item">Balances</div>
            <div class="nav-item">Customers</div>
            <div class="nav-item">Reports</div>
            <div class="nav-item">Settings</div>
            
            <!-- NEW TARGET: Visually distinct, unique text -->
            <div class="sidebar-footer">
              <p class="pro-title">Unlock PayFlow Pro</p>
              <p class="pro-desc">Get higher API limits and custom invoicing.</p>
              <button class="btn-upgrade" id="btn-upgrade-pro">Upgrade to Pro</button>
            </div>
          </div>

          <div class="main-content">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px; tracking: tight;">Payments Overview</h1>
              <div class="header-actions">
                <button class="btn-outline">Filter</button>
                <button class="btn-outline">Export CSV</button>
                <!-- EXISTING TARGET: Unique text -->
                <button class="action-generate-report" id="btn-gen-report">Generate Tax Report</button>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <div style="color: #64748b; font-size: 14px; font-weight: 600;">Gross Volume</div>
                <div class="stat-value">$124,500.00</div>
                <div class="stat-trend">↑ 12.5% vs last month</div>
              </div>
              <div class="stat-card">
                <div style="color: #64748b; font-size: 14px; font-weight: 600;">Net Volume</div>
                <div class="stat-value">$118,250.00</div>
                <div class="stat-trend">↑ 10.2% vs last month</div>
              </div>
              <div class="stat-card">
                <div style="color: #64748b; font-size: 14px; font-weight: 600;">New Customers</div>
                <div class="stat-value">342</div>
                <div class="stat-trend" style="color: #64748b;">→ Stable</div>
              </div>
            </div>

            <div class="table-container">
              <table class="data-table">
                <thead><tr><th>Amount</th><th>Status</th><th>Customer</th><th>Date</th></tr></thead>
                <tbody>
                  <tr><td>$45.00</td><td><span class="status-badge status-success">Succeeded</span></td><td>cus_12345</td><td>Today, 2:30 PM</td></tr>
                  <tr><td>$120.00</td><td><span class="status-badge status-success">Succeeded</span></td><td>cus_98765</td><td>Today, 1:15 PM</td></tr>
                  <tr><td>$89.99</td><td><span class="status-badge status-failed">Failed</span></td><td>cus_45678</td><td>Yesterday</td></tr>
                  <tr><td>$2,500.00</td><td><span class="status-badge status-success">Succeeded</span></td><td>cus_enterprise</td><td>Oct 12, 2023</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div id="toast-container">
            <div class="toast" id="toast-report">✅ Tax Report Generated</div>
            <div class="toast pro" id="toast-pro">🚀 Upgraded to PayFlow PRO!</div>
          </div>

          <script>
            document.getElementById('btn-gen-report').addEventListener('click', function() {
              document.getElementById('toast-report').style.display = 'block';
            });
            document.getElementById('btn-upgrade-pro').addEventListener('click', function() {
              document.getElementById('toast-pro').style.display = 'block';
            });
          </script>
        </body>
      </html>
    `);

    // Initialize Lazarus
    const lazarus = new Lazarus(page, {
      ollama: { apiUrl: "http://localhost:11434/api/generate", model: "llava", allowFastMatch: false },
      scriptId: "demo-fintech-dashboard",
      supabase: env.NEXT_PUBLIC_SUPABASE_URL ? {
        url: env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      } : undefined,
      enableTelemetry: true,
    });

    console.log("🚨 [Action 1] Attempting to click legacy 'Tax Report' button...");
    
    // HEAL NUMBER 1 
    await lazarus.click("Generate Tax Report button", "#legacy-tax-btn-999");

    console.log("✅ [Action 1] Success. Moving to next step.");
    await page.waitForTimeout(1000);

    console.log("🚨 [Action 2] Attempting to click legacy 'Upgrade' button...");

    // HEAL NUMBER 2
    await lazarus.click("Upgrade to Pro button", "#legacy-upgrade-link");

    console.log("✅ [Action 2] Success.");
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
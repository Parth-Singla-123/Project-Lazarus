/**
 * MASSIVE DEMO 1: E-Commerce Refactor
 * Demonstrates Lazarus finding a heavily mutated button in a complex, cluttered DOM.
 */
import { chromium } from "playwright";
import { Lazarus } from "../src/index";

async function main() {
  console.log("🚀 [Demo 1] Starting E-Commerce Checkout Flow...");
  
  // Headless: false so the audience can watch the magic happen
  const browser = await chromium.launch({ headless: false, slowMo: 500 }); 
  const page = await browser.newPage();

  // 1. A MASSIVE, complex DOM simulating a real e-commerce store
  await page.setContent(`
    <!doctype html>
    <html lang="en">
      <head>
        <style>
          body { font-family: system-ui, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
          .nav { display: flex; justify-content: space-between; padding: 20px; background: white; shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; }
          .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .cart-sidebar { position: fixed; right: 0; top: 0; width: 350px; height: 100vh; background: white; border-left: 1px solid #e5e7eb; padding: 24px; box-shadow: -4px 0 15px rgba(0,0,0,0.05); }
          
          /* The new button styling - no IDs, just utility classes */
          .action-primary-2024 { 
            width: 100%; padding: 16px; background: #000; color: #fff; 
            border: none; border-radius: 9999px; font-weight: 600; 
            font-size: 16px; cursor: pointer; margin-top: 24px;
            transition: transform 0.2s;
          }
          .action-primary-2024:hover { transform: scale(1.02); }
        </style>
      </head>
      <body>
        <div class="nav">
          <h2>TechStore Pro</h2>
          <div>Profile | Orders | Help</div>
        </div>

        <div class="grid">
          <div class="card"><h3>MacBook Pro M3</h3><p>$1,999</p><button>Add to Cart</button></div>
          <div class="card"><h3>iPhone 15 Pro</h3><p>$999</p><button>Add to Cart</button></div>
          <div class="card"><h3>AirPods Max</h3><p>$549</p><button>Add to Cart</button></div>
        </div>

        <div class="cart-sidebar">
          <h2>Your Cart (3 items)</h2>
          <div style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
            <p>Subtotal: $3,547.00</p>
            <p>Tax: $283.76</p>
            <h3 style="font-size: 24px;">Total: $3,830.76</h3>
          </div>
          
          <!-- THIS IS THE TARGET. Notice it has NO ID, and complex classes -->
          <button class="action-primary-2024" aria-label="Proceed to secure checkout">
            Secure Checkout 🔒
          </button>
          
          <button style="width: 100%; padding: 12px; margin-top: 10px; background: transparent; border: 1px solid #ccc; border-radius: 9999px;">
            Continue Shopping
          </button>
        </div>

        <div id="success-banner" style="display: none; position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 16px 32px; border-radius: 8px; font-weight: bold; z-index: 99999;">
          SUCCESS: Entering Checkout Flow!
        </div>

        <script>
          // Success logic
          document.querySelector('.action-primary-2024').addEventListener('click', () => {
            document.getElementById('success-banner').style.display = 'block';
          });
        </script>
      </body>
    </html>
  `);

  // 2. Initialize Lazarus strictly for REAL AI Vision
  const lazarus = new Lazarus(page, {
    ollama: { apiUrl: "http://localhost:11434/api/generate", model: "moondream", allowFastMatch: false },
    scriptId: "demo-ecommerce-checkout",
    enableTelemetry: true,
  });

  console.log("🚨 QA Script expects old layout. Attempting to click...");
  
  // 3. The Broken Script
  // In your video, point out that this is the OLD code that is about to rewrite itself.
  await lazarus.click("Secure Checkout Button", "#checkout-btn-old");

  // Keep browser open for 4 seconds to prove it worked
  await page.waitForTimeout(4000);
  await browser.close();
}

main().catch(console.error);
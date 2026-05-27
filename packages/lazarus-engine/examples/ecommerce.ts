/**
 * Example: E-commerce Testing with Self-Healing
 * Demonstrates using Lazarus for a realistic shopping flow
 */

import { chromium, Browser, Page } from "playwright";
import { Lazarus } from "../src/index";

async function ecommerceTest() {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const lazarus = new Lazarus(page, {
      ollama: {
        apiUrl: "http://localhost:11434/api/generate",
      },
      enableTelemetry: true,
    });

    console.log("[E-Commerce Test] Starting...");

    // Step 1: Navigate to store
    await page.goto("https://example-ecommerce.com");
    console.log("[E-Commerce Test] Navigated to store");

    // Step 2: Search for product - selectors might change
    await page.fill("input[placeholder='Search products']", "laptop");
    await lazarus.click("Search button", "[aria-label='Search']");
    console.log("[E-Commerce Test] Searched for laptop");

    // Step 3: Select first product
    await page.waitForSelector(".product-item");
    await lazarus.click("First product", ".product-item:first-child");
    console.log("[E-Commerce Test] Selected product");

    // Step 4: Add to cart
    await lazarus.click("Add to cart button", ".btn-add-to-cart");
    console.log("[E-Commerce Test] Added to cart");

    // Step 5: Proceed to checkout
    await lazarus.click("Checkout button", ".btn-checkout");
    console.log("[E-Commerce Test] Proceeding to checkout");

    // Step 6: Fill shipping address
    await page.fill("input[name='address']", "123 Main St");
    await page.fill("input[name='city']", "San Francisco");
    await page.fill("input[name='zip']", "94102");
    console.log("[E-Commerce Test] Address filled");

    // Step 7: Complete purchase - might use changed selector
    await lazarus.click("Complete purchase button", ".btn-purchase");
    console.log("[E-Commerce Test] Purchase complete! ✓");

    // Verify order confirmation
    await page.waitForSelector(".order-confirmation", { timeout: 5000 });
    console.log("[E-Commerce Test] Order confirmation received! ✓✓✓");

  } catch (error) {
    console.error("[E-Commerce Test] Failed:", error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

if (require.main === module) {
  ecommerceTest();
}

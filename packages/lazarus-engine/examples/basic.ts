/**
 * Example: Basic Lazarus Usage
 * This demonstrates how to use the Lazarus self-healing engine in a Playwright script
 */

import { chromium, Browser, Page } from "playwright";
import { Lazarus } from "../src/index";

async function runExample() {
  let browser: Browser | null = null;

  try {
    // Launch browser
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Initialize Lazarus with optional Supabase config
    const lazarus = new Lazarus(page, {
      ollama: {
        apiUrl: process.env.OLLAMA_API_URL || "http://localhost:11434/api/generate",
        model: "moondream",
      },
      supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
      },
      enableTelemetry: !!process.env.SUPABASE_URL,
    });

    // Navigate to test page
    await page.goto("https://example.com");

    // Use Lazarus.click() - it will auto-heal if selector breaks
    console.log("[Test] Attempting to click 'Login' button...");
    await lazarus.click("Login button", "#login-btn");

    console.log("[Test] Login successful! ✓");

    // Another example - fill form field and click submit
    await page.fill("input[name='username']", "testuser");
    await page.fill("input[name='password']", "testpass");

    console.log("[Test] Attempting to click 'Submit' button...");
    await lazarus.click("Submit button", ".btn-submit");

    console.log("[Test] Form submitted! ✓");

    // Wait a bit to see results
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error("[Test] Error:", error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run if this is the main module
if (require.main === module) {
  runExample();
}

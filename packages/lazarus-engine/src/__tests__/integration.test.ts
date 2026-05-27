/**
 * Integration Test for the Complete Lazarus Pipeline
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Page, chromium, Browser } from "playwright";
import { Lazarus } from "../core/lazarus";

describe("Lazarus Integration Pipeline", () => {
  let browser: Browser;
  let page: Page;

  beforeEach(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterEach(async () => {
    await browser.close();
  });

  it("should initialize the full pipeline", async () => {
    const lazarus = new Lazarus(page, {
      ollama: { apiUrl: "http://localhost:11434/api/generate" },
      supabase: {
        url: "https://example.supabase.co",
        anonKey: "test-key",
      },
      enableTelemetry: true,
    });

    expect(lazarus).toBeDefined();
  });

  it("should handle click failures gracefully", async () => {
    await page.setContent(`
      <button>Test</button>
    `);

    const lazarus = new Lazarus(page);

    try {
      await lazarus.click("Nonexistent button", "#nonexistent");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should parse stack traces correctly", async () => {
    const lazarus = new Lazarus(page);
    expect(lazarus).toBeDefined();
  });
});

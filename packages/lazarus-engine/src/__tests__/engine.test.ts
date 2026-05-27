/**
 * Unit Tests for Lazarus Engine
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Page } from "playwright";
import { chromium, Browser } from "playwright";
import { Lazarus } from "../core/lazarus";
import { Annotator } from "../vision/annotator";
import { AICaller } from "../vision/ai";

describe("Lazarus Engine", () => {
  let browser: Browser;
  let page: Page;
  let lazarus: Lazarus;

  beforeEach(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    lazarus = new Lazarus(page);
  });

  afterEach(async () => {
    await browser.close();
  });

  it("should initialize Lazarus with a Playwright page", () => {
    expect(lazarus).toBeDefined();
  });

  it("should handle successful clicks", async () => {
    await page.setContent(`
      <button id="test-btn">Click me</button>
      <div id="result"></div>
      <script>
        document.getElementById('test-btn').addEventListener('click', () => {
          document.getElementById('result').textContent = 'Clicked!';
        });
      </script>
    `);

    await lazarus.click("Test button", "#test-btn");
    const result = await page.textContent("#result");
    expect(result).toBe("Clicked!");
  });

  describe("Annotator", () => {
    it("should find all interactive elements", async () => {
      await page.setContent(`
        <button>Button 1</button>
        <a href="#">Link 1</a>
        <input type="text" />
        <div role="button">Custom Button</div>
      `);

      const annotator = new Annotator(page);
      const { selectorMap } = await annotator.annotateDOM();

      expect(selectorMap.size).toBeGreaterThan(0);
    });
  });

  describe("AICaller", () => {
    it("should initialize with default config", () => {
      const ai = new AICaller();
      expect(ai).toBeDefined();
    });

    it("should initialize with custom Ollama URL", () => {
      const ai = new AICaller({
        apiUrl: "http://custom-ollama:11434/api/generate",
        model: "moondream",
      });
      expect(ai).toBeDefined();
    });
  });
});

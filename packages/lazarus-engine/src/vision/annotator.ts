import { Page } from "playwright";

export interface AnnotatedElement {
  selector: string;
  tagName: string;
  text: string;
  ariaLabel: string;
  role: string;
}

export interface AnnotationResult {
  selectorMap: Map<number, string>;
  metadataMap: Map<number, AnnotatedElement>;
}

/**
 * Annotator - Injects visual markers on page elements
 * Draws red bounding boxes with numbers around interactive elements
 */
export class Annotator {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Injects JavaScript to annotate interactive elements with numbered red boxes
   * Returns a map of number -> CSS selector
   */
  async annotateDOM(): Promise<AnnotationResult> {
    const annotation = await this.page.evaluate(() => {
      const overlayId = "lazarus-overlay-root";
      const existingOverlay = document.getElementById(overlayId);
      if (existingOverlay) {
        existingOverlay.remove();
      }

      const overlayRoot = document.createElement("div");
      overlayRoot.id = overlayId;
      overlayRoot.style.cssText = `
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 10000;
      `;
      document.body.appendChild(overlayRoot);

      // Helper function defined inside page context
      function generateSelector(element: HTMLElement): string {
        // Try ID first
        if (element.id) {
          return `#${element.id}`;
        }

        // Build a path based on classes and position
        const classSelector = element.className
          ?.split(" ")
          .filter((c) => c && !c.startsWith("lazarus-"))
          .join(".");

        if (classSelector) {
          return `.${classSelector}`;
        }

        // Fallback: build a path from parent elements
        let path: string[] = [];
        let current = element;

        while (current && current !== document.body) {
          let selector = current.tagName.toLowerCase();

          if (current.id) {
            path.unshift(`${selector}#${current.id}`);
            break;
          }

          if (current.className) {
            selector += `.${current.className.split(" ").join(".")}`;
          }

          path.unshift(selector);
          current = current.parentElement!;
        }

        return path.join(" > ");
      }

      function cleanText(value: string | null | undefined): string {
        return (value || "").replace(/\s+/g, " ").trim();
      }

      const elements = document.querySelectorAll("button, a, input, [role='button']");
      const map: Record<number, string> = {};
      const metadata: Record<number, {
        selector: string;
        tagName: string;
        text: string;
        ariaLabel: string;
        role: string;
      }> = {};
      
      elements.forEach((el: any, index: number) => {
        const number = index + 1;
        const element = el as HTMLElement;
        
        // Create a unique CSS selector for this element
        const selector = generateSelector(element);
        map[number] = selector;
        metadata[number] = {
          selector,
          tagName: element.tagName.toLowerCase(),
          text: cleanText(element.textContent),
          ariaLabel: cleanText(element.getAttribute("aria-label")),
          role: cleanText(element.getAttribute("role")),
        };
        
        // Draw red box with number
        const rect = element.getBoundingClientRect();
        const box = document.createElement("div");
        box.setAttribute("data-lazarus-overlay", "box");
        box.style.cssText = `
          position: fixed;
          border: 3px solid red;
          border-radius: 4px;
          pointer-events: none;
          z-index: 10000;
          left: ${rect.left}px;
          top: ${rect.top}px;
          width: ${rect.width}px;
          height: ${rect.height}px;
        `;
        
        const label = document.createElement("span");
        const descriptiveText = metadata[number].text || metadata[number].ariaLabel || metadata[number].tagName;
        label.textContent = `[${number}] ${descriptiveText}`;
        label.setAttribute("data-lazarus-overlay", "label");
        label.style.cssText = `
          position: fixed;
          left: ${rect.left + 5}px;
          top: ${rect.top + 5}px;
          background: #fbbf24; /* Bright Yellow */
          color: black;        /* Black text for contrast */
          padding: 4px 8px;
          border: 2px solid red;
          border-radius: 4px;
          font-size: 16px;     /* Larger font */
          font-weight: 900;
          z-index: 10001;
          pointer-events: none;
        `;
        
        overlayRoot.appendChild(box);
        overlayRoot.appendChild(label);
      });
      
      return { map, metadata };
    });

    return {
      selectorMap: new Map(Object.entries(annotation.map).map(([k, v]) => [parseInt(k), v])),
      metadataMap: new Map(
        Object.entries(annotation.metadata).map(([k, v]) => [parseInt(k), v])
      ),
    };
  }
}

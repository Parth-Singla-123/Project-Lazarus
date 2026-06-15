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

export class Annotator {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async annotateDOM(): Promise<AnnotationResult> {
    const annotation = await this.page.evaluate(() => {
      
      // CRITICAL: Only draw boxes around elements the AI can physically see
      function isElementVisible(el: HTMLElement): boolean {
        if (!el) return false;
        
        // 1. Check physical dimensions first (fastest)
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;

        // 2. Walk up the DOM tree to check opacity/display/visibility on parents
        let current: HTMLElement | null = el;
        while (current && current !== document.body) {
          const style = window.getComputedStyle(current);
          if (
            style.display === 'none' || 
            style.visibility === 'hidden' || 
            style.opacity === '0'
          ) {
            return false;
          }
          current = current.parentElement;
        }
        
        return true;
      }

      const allElements = document.querySelectorAll("button, a, input, [role='button']");
      const visibleElements = Array.from(allElements).filter(el => isElementVisible(el as HTMLElement));

      const overlayId = "lazarus-overlay-root";
      const existingOverlay = document.getElementById(overlayId);
      if (existingOverlay) existingOverlay.remove();

      const overlayRoot = document.createElement("div");
      overlayRoot.id = overlayId;
      overlayRoot.style.cssText = `position: fixed; inset: 0; pointer-events: none; z-index: 10000;`;
      document.body.appendChild(overlayRoot);

      function generateSelector(element: HTMLElement): string {
        if (element.id) return `#${element.id}`;

        let path: string[] = [];
        let current: HTMLElement | null = element;

        while (current && current !== document.body) {
          if (current.id) {
            path.unshift(`#${current.id}`);
            break;
          }

          let index = 1;
          let sibling = current.previousElementSibling;
          
          // Count how many siblings of the same tag appear before this element
          while (sibling) {
            if (sibling.tagName === current.tagName) {
              index++;
            }
            sibling = sibling.previousElementSibling;
          }

          let selector = current.tagName.toLowerCase();
          
          // Add the exact index to make it 100% unique
          if (index > 1) {
            selector += `:nth-of-type(${index})`;
          }

          // We can also append the specific classes just to make it readable in the code diff
          const cleanClasses = current.className?.split(" ").filter(c => c && !c.startsWith("lazarus-") && !c.includes(":")).join(".");
          if (cleanClasses && index === 1) {
             selector += `.${cleanClasses}`;
          }

          path.unshift(selector);
          current = current.parentElement;
        }

        return path.join(" > ");
      }

      function cleanText(value: string | null | undefined): string {
        return (value || "").replace(/\s+/g, " ").trim();
      }

      const map: Record<number, string> = {};
      const metadata: Record<number, any> = {};
      
      visibleElements.forEach((el: any, index: number) => {
        const number = index + 1;
        const element = el as HTMLElement;
        const selector = generateSelector(element);
        map[number] = selector;
        metadata[number] = {
          selector,
          tagName: element.tagName.toLowerCase(),
          text: cleanText(element.textContent),
          ariaLabel: cleanText(element.getAttribute("aria-label")),
          role: cleanText(element.getAttribute("role")),
        };
        
        const rect = element.getBoundingClientRect();
        const box = document.createElement("div");
        box.style.cssText = `position: fixed; border: 3px solid red; border-radius: 4px; pointer-events: none; z-index: 10000; left: ${rect.left}px; top: ${rect.top}px; width: ${rect.width}px; height: ${rect.height}px;`;
        
        const label = document.createElement("span");
        label.textContent = `[${number}]`;
        label.style.cssText = `position: fixed; left: ${rect.left + 5}px; top: ${rect.top + 5}px; background: #fbbf24; color: black; padding: 4px 8px; border: 2px solid red; border-radius: 4px; font-size: 16px; font-weight: 900; z-index: 10001; pointer-events: none;`;
        
        overlayRoot.appendChild(box);
        overlayRoot.appendChild(label);
      });
      
      return { map, metadata };
    });

    return {
      selectorMap: new Map(Object.entries(annotation.map).map(([k, v]) => [parseInt(k), v])),
      metadataMap: new Map(Object.entries(annotation.metadata).map(([k, v]) => [parseInt(k), v])),
    };
  }
}
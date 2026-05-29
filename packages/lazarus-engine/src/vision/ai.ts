/**
 * AICaller - Communicates with Ollama/Moondream for vision-based element identification
 */
export interface OllamaConfig {
  apiUrl?: string;
  model?: string;
  requestTimeoutMs?: number;
  allowFastMatch?: boolean;
}

export interface AnnotatedElement {
  selector: string;
  tagName: string;
  text: string;
  ariaLabel: string;
  role: string;
}


export class AICaller {
  private apiUrl: string;
  private model: string;
  private requestTimeoutMs: number;
  private allowFastMatch: boolean;

  constructor(config?: OllamaConfig) {
    this.apiUrl = config?.apiUrl || process.env.OLLAMA_API_URL || "http://localhost:11434/api/generate";
    // UPGRADE: Default to LLaVA instead of moondream
    this.model = config?.model || "llava"; 
    this.requestTimeoutMs = config?.requestTimeoutMs || 60000;
    this.allowFastMatch = config?.allowFastMatch ?? true;
  }

  async identifyElement(
    targetDescription: string,
    selectorMap: Map<number, string>,
    metadataMap: Map<number, AnnotatedElement>,
    screenshotBase64: string
  ): Promise<string> {
    
    if (this.allowFastMatch) {
      const fastMatch = this.findFastMatch(targetDescription, selectorMap, metadataMap);
      if (fastMatch) {
        console.log(`[Lazarus AI] Fast match: ${targetDescription} -> ${fastMatch}`);
        return fastMatch;
      }
    }

    // 1. Build the DOM Context so the AI isn't blind
    const candidateLines = Array.from(selectorMap.entries())
      .slice(0, 15) // Get up to 15 elements
      .map(([number, selector]) => {
        const metadata = metadataMap.get(number);
        const label = metadata
          ? [metadata.tagName, metadata.text, metadata.ariaLabel, metadata.role].filter(Boolean).join(" | ")
          : selector;
        return `Box ${number}: ${label}`;
      })
      .join("\n");

    const compressedScreenshot = this.stripBase64Header(screenshotBase64);

    // 2. The Bulletproof Prompt (Forcing the [X] bracket format)
    const prompt = `You are a QA automation agent.
Target element to find: "${targetDescription}"

Here is the data for the red boxes in the image:
${candidateLines}

Look at the image and the data above. Which Box number is the Target?
You MUST wrap your final answer in brackets. For example, if the answer is box 4, reply ONLY with: [4]`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          images: [compressedScreenshot],
          stream: false,
          keep_alive: "5m",
          options: {
            temperature: 0,
            num_predict: 50, // Let it talk if it needs to
          },
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);

      const data = await response.json() as { response?: string };
      const rawResponse = (data.response || "").trim();
      console.log(`[Lazarus AI] Raw response from ${this.model}: ${rawResponse}`);

      // 3. SAFE EXTRACTION: Look SPECIFICALLY for a number inside brackets like [4]
      const bracketMatch = rawResponse.match(/\[(\d+)\]/);
      
      if (bracketMatch && bracketMatch[1]) {
        const elementNumber = parseInt(bracketMatch[1], 10);
        const selector = selectorMap.get(elementNumber);
        
        if (selector) {
          console.log(`[Lazarus AI] Found element: ${targetDescription} -> ${selector}`);
          return selector;
        }
      }

      // If LLaVA forgot the brackets, try to find ANY valid number as a last resort
      const fallbackNumbers = rawResponse.match(/\d+/g);
      if (fallbackNumbers) {
        // Reverse the array to get the LAST number it said (usually the final answer)
        for (const numStr of fallbackNumbers.reverse()) {
          const elementNumber = parseInt(numStr, 10);
          const selector = selectorMap.get(elementNumber);
          if (selector) {
            console.log(`[Lazarus AI] Extracted fallback number ${elementNumber} -> ${selector}`);
            return selector;
          }
        }
      }

      console.warn(`[Lazarus AI] AI returned invalid response. Falling back to heuristic.`);
      const heuristicMatch = this.findFallbackMatch(targetDescription, metadataMap);
      if (heuristicMatch) return heuristicMatch;

      throw new Error("AI could not identify a valid element number.");
    } catch (error) {
      console.error("[Lazarus AI] Error:", error);
      throw error;
    }
  }

  // Same fast match as before
  private findFastMatch(target: string, sMap: Map<number, string>, mMap: Map<number, AnnotatedElement>): string | null {
    if (sMap.size === 1) {
    return sMap.values().next().value || null;
    }

    const targetWords = target.toLowerCase().split(/\s+/).filter(Boolean);
    const scoredCandidates = Array.from(mMap.entries()).map(([number, metadata]) => {
      const haystack = `${metadata.text} ${metadata.ariaLabel} ${metadata.role} ${metadata.tagName}`.toLowerCase();
      let score = 0;

      for (const word of targetWords) {
        if (word.length <= 2) continue;
        if (haystack.includes(word)) score += 2;
        if (metadata.tagName.toLowerCase() === word) score += 3;
        if (metadata.role.toLowerCase() === word) score += 2;
        if (metadata.text.toLowerCase() === word) score += 3;
      }

      return { number, metadata, score };
    });

    const topCandidate = scoredCandidates.sort((left, right) => right.score - left.score)[0];
    if (topCandidate && topCandidate.score >= 4) {
      return topCandidate.metadata.selector;
    }
    return null; 
  }

  // Separated fallback logic for cleaner code
  private findFallbackMatch(targetDescription: string, metadataMap: Map<number, AnnotatedElement>): string | null {
    const targetWords = targetDescription.toLowerCase().split(/\s+/).filter(Boolean);
    const scoredCandidates = Array.from(metadataMap.entries()).map(([number, metadata]) => {
      const haystack = `${metadata.text} ${metadata.ariaLabel} ${metadata.role} ${metadata.tagName}`.toLowerCase();
      let score = 0;
      for (const word of targetWords) {
        if (word.length <= 2) continue;
        if (haystack.includes(word)) score += 2;
        if (metadata.text.toLowerCase() === word) score += 3;
      }
      return { number, metadata, score };
    });

    const best = scoredCandidates.sort((a, b) => b.score - a.score)[0];
    if (best && best.score > 0) return best.metadata.selector;
    return null;
  }

  private stripBase64Header(dataUrl: string): string {
    if (dataUrl.startsWith("data:image/jpeg;base64,")) return dataUrl.split(",")[1];
    return dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  }
}
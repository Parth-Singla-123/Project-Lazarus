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
  private model: string = "moondream";
  private requestTimeoutMs: number;
  private allowFastMatch: boolean;

  constructor(config?: OllamaConfig) {
    this.apiUrl = config?.apiUrl || process.env.OLLAMA_API_URL || "http://localhost:11434/api/generate";
    this.model = config?.model || "moondream";
    this.requestTimeoutMs = config?.requestTimeoutMs || 20000;
    this.allowFastMatch = config?.allowFastMatch ?? true;
  }

  /**
   * Send screenshot to Moondream and get the element number
   */
  async identifyElement(
    targetDescription: string,
    selectorMap: Map<number, string>,
    metadataMap: Map<number, AnnotatedElement>,
    screenshotBase64: string
  ): Promise<string> {
    const fastMatch = this.allowFastMatch
      ? this.findFastMatch(targetDescription, selectorMap, metadataMap)
      : null;

    if (fastMatch) {
      console.log(`[Lazarus AI] Fast match: ${targetDescription} -> ${fastMatch}`);
      return fastMatch;
    }

    const candidateLines = Array.from(selectorMap.entries())
      .slice(0, 8)
      .map(([number, selector]) => {
        const metadata = metadataMap.get(number);
        const label = metadata
          ? [metadata.tagName, metadata.text, metadata.ariaLabel, metadata.role]
              .filter(Boolean)
              .join(" | ")
          : selector;
        return `${number}: ${label}`;
      })
      .join("\n");

    const compressedScreenshot = this.compressDataUrl(screenshotBase64);

    const prompt = `Look at this screenshot of a web page.
The interactive elements are numbered in red.
Target: ${targetDescription}

Candidates:
${candidateLines || "(none)"}

Reply with ONLY one of these:
- a number like 1, 2, 3
- NOT_FOUND if there is no match`;

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
            num_predict: 8,
          },
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json() as { response?: string };
      const rawResponse = (data.response || "").trim();
      console.log(`[Lazarus AI] Raw response: ${rawResponse || "<empty>"}`);

      const numberMatch = rawResponse.match(/\d+/);
      const wordToNumber: Record<string, number> = {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5,
        six: 6,
        seven: 7,
        eight: 8,
        nine: 9,
        ten: 10,
      };

      const wordMatch = Object.entries(wordToNumber).find(([word]) =>
        new RegExp(`\\b${word}\\b`, "i").test(rawResponse)
      );

      if (!numberMatch && !wordMatch) {
        if (selectorMap.size === 1) {
          const onlySelector = selectorMap.values().next().value as string | undefined;
          if (onlySelector) {
            console.warn(
              `[Lazarus AI] Empty or unusable response; falling back to the only available selector: ${onlySelector}`
            );
            return onlySelector;
          }
        }

        const targetWords = targetDescription.toLowerCase().split(/\s+/).filter(Boolean);
        const scoredCandidates = Array.from(metadataMap.entries()).map(([number, metadata]) => {
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

        const heuristicMatch = scoredCandidates.sort((left, right) => right.score - left.score)[0];

        if (heuristicMatch && heuristicMatch.score > 0) {
          const { number, metadata } = heuristicMatch;
          console.warn(
            `[Lazarus AI] Falling back to heuristic match: ${number} -> ${metadata.selector}`
          );
          return metadata.selector;
        }

        throw new Error("AI could not identify the element");
      }

      const elementNumber = numberMatch
        ? parseInt(numberMatch[0])
        : wordMatch
          ? wordToNumber[wordMatch[0].toLowerCase()]
          : NaN;
      const selector = selectorMap.get(elementNumber);

      if (!selector) {
        throw new Error(`No selector found for element #${elementNumber}`);
      }

      console.log(`[Lazarus AI] Found element: ${targetDescription} -> ${selector}`);
      return selector;
    } catch (error) {
      console.error("[Lazarus AI] Error:", error);
      throw error;
    }
  }

  private findFastMatch(
    targetDescription: string,
    selectorMap: Map<number, string>,
    metadataMap: Map<number, AnnotatedElement>
  ): string | null {
    if (selectorMap.size === 1) {
      return selectorMap.values().next().value || null;
    }

    const targetWords = targetDescription.toLowerCase().split(/\s+/).filter(Boolean);
    const scoredCandidates = Array.from(metadataMap.entries()).map(([number, metadata]) => {
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

  private compressDataUrl(dataUrl: string): string {
    if (dataUrl.startsWith("data:image/jpeg;base64,")) {
      return dataUrl.split(",")[1] || dataUrl;
    }

    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] || "" : dataUrl;
    return base64;
  }
}

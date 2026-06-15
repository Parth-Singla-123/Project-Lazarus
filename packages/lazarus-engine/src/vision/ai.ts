export interface OllamaConfig { apiUrl?: string; model?: string; requestTimeoutMs?: number; allowFastMatch?: boolean; }
export interface AnnotatedElement { selector: string; tagName: string; text: string; ariaLabel: string; role: string; }

export class AICaller {
  private apiUrl: string; private model: string; private requestTimeoutMs: number; private allowFastMatch: boolean;

  constructor(config?: OllamaConfig) {
    this.apiUrl = config?.apiUrl || process.env.OLLAMA_API_URL || "http://localhost:11434/api/generate";
    this.model = config?.model || "llava"; 
    this.requestTimeoutMs = config?.requestTimeoutMs || 90000;
    this.allowFastMatch = config?.allowFastMatch ?? true;
  }

  async identifyElement(targetDescription: string, selectorMap: Map<number, string>, metadataMap: Map<number, AnnotatedElement>, screenshotBase64: string): Promise<string> {
    if (this.allowFastMatch) {
      const fastMatch = this.findFastMatch(targetDescription, selectorMap, metadataMap);
      if (fastMatch !== null) {
        const sel = selectorMap.get(fastMatch);
        if (sel) { console.log(`[Lazarus AI] Fast match: ${targetDescription} -> ${sel}`); return sel; }
      }
    }

    const candidateLines = Array.from(selectorMap.entries())
    .map(([number, selector]) => {
        const metadata = metadataMap.get(number);
        const label = metadata ? [metadata.tagName, metadata.text, metadata.ariaLabel].filter(Boolean).join(" | ") : selector;
        return `Box ${number}: ${label}`;
      }).join("\n");

    const compressedScreenshot = this.stripBase64Header(screenshotBase64);
    const maxBox = Math.max(...Array.from(selectorMap.keys()));

    const prompt = `Target element to find: "${targetDescription}"
Here is the data for the VISIBLE red boxes in the image (Boxes 1 to ${maxBox}):
${candidateLines}
Task: Which Box number matches the Target?
You MUST respond strictly in valid JSON format containing ONLY the integer.
Example:
{
  "boxNumber": 4
}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

      const response = await fetch(this.apiUrl, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ model: this.model, prompt: prompt, images: [compressedScreenshot], stream: false, format: "json", options: { temperature: 0, num_predict: 20 } }),
      });

      clearTimeout(timeout);
      if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);

      const data = await response.json() as { response?: string };
      const rawResponse = (data.response || "").trim();
      console.log(`[Lazarus AI] Raw response from ${this.model}: ${rawResponse}`);

      try {
        const parsed = JSON.parse(rawResponse);
        if (parsed && parsed.boxNumber !== undefined && parsed.boxNumber !== null) {
           const targetSelector = selectorMap.get(parseInt(String(parsed.boxNumber), 10));
           if (targetSelector) {
             console.log(`[Lazarus AI] Target found: ${targetSelector}`);
             return targetSelector;
           }
        }
      } catch (jsonError) { console.warn(`[Lazarus AI] AI did not return valid JSON.`); }

      console.warn(`[Lazarus AI] Falling back to heuristic.`);
      const heuristicMatch = this.findFallbackMatch(targetDescription, metadataMap);
      if (heuristicMatch !== null) {
        const sel = selectorMap.get(heuristicMatch);
        if (sel) return sel;
      }
      throw new Error("AI could not identify a valid element number.");
    } catch (error) { console.error("[Lazarus AI] Error:", error); throw error; }
  }

  private findFastMatch(target: string, sMap: Map<number, string>, mMap: Map<number, AnnotatedElement>): number | null {
    if (sMap.size === 1) return sMap.keys().next().value ?? null;
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
    if (topCandidate && topCandidate.score >= 4) return topCandidate.number;
    return null; 
  }

  public findFallbackMatch(targetDescription: string, metadataMap: Map<number, AnnotatedElement>): number | null {
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
    if (best && best.score > 0) return best.number;
    return null;
  }

  private stripBase64Header(dataUrl: string): string {
    if (dataUrl.startsWith("data:image/jpeg;base64,")) return dataUrl.split(",")[1];
    return dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  }
}
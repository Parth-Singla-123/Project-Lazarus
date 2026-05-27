# Lazarus Engine

Self-healing UI automation engine with local AI vision. Uses Playwright, Moondream/Ollama, ts-morph AST rewriting, and Supabase for telemetry.

## Modules

### Core (`src/core/lazarus.ts`)
Main wrapper class that orchestrates the self-healing pipeline:
- Intercepts Playwright click() errors
- Extracts stack trace info
- Coordinates vision → AI → AST → telemetry flow
- Provides type-safe API

**Key Class:** `Lazarus`
- Constructor: `new Lazarus(page, options?)`
- Method: `click(targetDescription, fallbackSelector): Promise<void>`

### Vision (`src/vision/`)

#### Annotator (`annotator.ts`)
Injects JavaScript to mark interactive elements on page:
- Draws red bounding boxes with numbers
- Generates CSS selectors for each element
- Returns `Map<number, string>` mapping

**Key Class:** `Annotator`
- Method: `annotateDOM(): Promise<Map<number, string>>`

#### AI Caller (`ai.ts`)
Communicates with local Ollama instance running Moondream:
- Sends screenshot (Base64) + target description to Ollama
- Parses AI response to get element number
- Maps number to CSS selector

**Key Class:** `AICaller`
- Method: `identifyElement(description, selectorMap, screenshot): Promise<string>`

### AST (`src/ast/rewriter.ts`)
Uses ts-morph to rewrite source code:
- Finds original source file from stack trace
- Locates and replaces old selector with new one
- Saves file atomically via AST

**Key Class:** `CodeRewriter`
- Method: `replaceSelector(filePath, lineNumber, oldSelector, newSelector): Promise<void>`

### Telemetry (`src/telemetry/logger.ts`)
Logs healing events to Supabase PostgreSQL:
- Inserts records into `healing_events` table
- Includes screenshot, old/new selectors, status
- Enables real-time dashboard via Realtime subscriptions

**Key Class:** `TelemetryLogger`
- Method: `logHealing(event): Promise<void>`

## Installation

```bash
pnpm add -D @types/node typescript ts-node
pnpm install
```

## Building

```bash
pnpm build
```

Outputs compiled JavaScript + types to `dist/`.

## Testing

```bash
pnpm test              # Run all tests
pnpm test:ui           # Run with UI dashboard
```

## Examples

### Basic Usage

```typescript
import { Lazarus } from "lazarus-engine";
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
const lazarus = new Lazarus(page);

// Auto-healing click - will find new selector if button moves
await lazarus.click("Login Button", "#old-login-btn");
```

### With Ollama & Supabase

```typescript
const lazarus = new Lazarus(page, {
  ollama: {
    apiUrl: "http://localhost:11434/api/generate",
    model: "moondream",
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
});

await lazarus.click("Submit", ".btn-submit");
```

## Architecture Flow

```
1. Test calls: lazarus.click("Buy", "#buy-btn")
                    ↓
2. Playwright tries to click #buy-btn
                    ↓
3. Element not found → TimeoutError
                    ↓
4. Error caught in try/catch
                    ↓
5. Extract stack trace → get file + line number
                    ↓
6. Annotator injects JS → draws boxes [1], [2], [3]...
                    ↓
7. Take page screenshot (Base64)
                    ↓
8. Send to Ollama: "Which box is 'Buy button'?" → "3"
                    ↓
9. Map number 3 → CSS selector ".primary-btn"
                    ↓
10. ts-morph rewrites file: "#buy-btn" → ".primary-btn"
                    ↓
11. Log event to Supabase healing_events table
                    ↓
12. Retry click with new selector → SUCCESS ✓
                    ↓
13. Real-time dashboard updates with healing event
```

## Dependencies

- **playwright**: ^1.40.0 - Browser automation
- **ts-morph**: ^20.0.0 - AST parsing/rewriting
- **@supabase/supabase-js**: ^2.38.0 - DB & realtime

## Configuration

### Environment Variables

```env
# Ollama (local inference)
OLLAMA_API_URL=http://localhost:11434/api/generate

# Supabase (optional, for telemetry)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
```

### Options

```typescript
interface LazyHealingOptions {
  ollama?: {
    apiUrl?: string;      // Default: http://localhost:11434/api/generate
    model?: string;       // Default: moondream
  };
  supabase?: {
    url?: string;         // Env: SUPABASE_URL
    anonKey?: string;     // Env: SUPABASE_ANON_KEY
  };
  enableTelemetry?: boolean; // Default: true if Supabase configured
}
```

## Debugging

Enable logs:
```typescript
const lazarus = new Lazarus(page);
// Logs go to console:
// [Lazarus] Element not found. Initiating self-healing...
// [Lazarus AI] Found element: Buy button -> .primary-btn
// [Lazarus AST] Replaced selector in src/test.ts:42
// [Lazarus Telemetry] Event logged successfully
```

## Limitations

1. Requires Ollama + moondream model running locally
2. Only works with TypeScript/JavaScript test files
3. AST rewriting doesn't preserve all formatting
4. Very large screenshots (4MB+) may be truncated in Supabase

## Roadmap

- [ ] Support for other vision models (Llava, Claude Vision)
- [ ] WebSocket support for real-time healing
- [ ] Visual diff of old vs new selectors in dashboard
- [ ] Integration with popular test frameworks (Jest, Mocha, Cypress)
- [ ] Selector history and rollback feature

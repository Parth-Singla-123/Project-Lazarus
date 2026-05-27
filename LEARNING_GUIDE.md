# Project Lazarus — Learning & Testing Guide

This guide teaches you how to run and test each component of Project Lazarus **incrementally**, so you understand exactly what's happening at each step.

---

## Prerequisites Checklist

Before you start, verify you have:

- [ ] **Node.js v20+** installed
  ```bash
  node --version
  ```
  
- [ ] **pnpm v8+** installed
  ```bash
  pnpm --version
  ```

- [ ] **Ollama running locally** with moondream model
  ```bash
  ollama list
  ```
  You should see `moondream:latest` in the list. If not:
  ```bash
  ollama pull moondream
  ollama run moondream
  ```
  Then keep it running in a separate terminal.

- [ ] **Supabase project** created (free tier is fine)
  - Go to https://supabase.com → sign up → create a project
  - Note: Project URL and Anon Key (in Settings → API)

- [ ] **Environment variables** set up
  ```bash
  # Check if this exists:
  cat apps/dashboard/.env.local
  ```
  Should contain:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  NEXT_PUBLIC_OLLAMA_API_URL=http://localhost:11434/api/generate
  ```

---

## Phase 1: Install & Build (15 min)

### Step 1a: Install all workspace dependencies
```bash
cd D:\Web Dev\@PROJECTS\Project-Lazarus
pnpm install
```
**What happens:** pnpm installs dependencies for both the dashboard and engine packages.

### Step 1b: Build the engine
```bash
pnpm --filter=lazarus-engine build
```
**What happens:** TypeScript is compiled to JavaScript. Check if it says `tsc` ran successfully.

### Step 1c: Verify Playwright browsers are downloaded
```bash
pnpm --filter=lazarus-engine exec playwright install chromium
```
**What happens:** Downloads the Chromium browser (needed for tests). This may take 1–2 minutes.

---

## Phase 2: Understand the Engine by Reading Tests (15 min)

Before running anything, **read** the existing tests to understand what the engine is supposed to do.

### Step 2a: Open the integration test
Open this file:
```
packages/lazarus-engine/src/__tests__/integration.test.ts
```

**Read sections:**
- `describe("Lazarus Integration Pipeline", ...)` — this shows the full flow.
- Look for the test called `"should initialize the full pipeline"` — this is the smallest end-to-end example.

**Key observations:**
- A mock Ollama server is created (returns element "1").
- A Playwright page with a real button is created.
- Lazarus is instantiated with the mock Ollama URL.
- `lazarus.click(...)` is called on a nonexistent selector.
- The test asserts that the click succeeds after healing.

### Step 2b: Open the engine test
Open:
```
packages/lazarus-engine/src/__tests__/engine.test.ts
```

**Read sections:**
- `describe("Lazarus Engine", ...)` — tests the `Lazarus` class itself.
- `describe("Annotator", ...)` — tests the DOM annotation logic.
- `describe("AICaller", ...)` — tests the Ollama integration.

---

## Phase 3: Run the Engine Tests (10 min)

Now **run** the tests to see them in action.

### Step 3a: Run all tests
```bash
pnpm --filter=lazarus-engine test
```

**What to expect:**
- Tests take 2–3 minutes.
- Look for: ✓ (green checkmarks) = passed, × (red X) = failed.
- If all show ✓, the engine is working correctly.

**If tests fail:**
- Look at the error message. Common issues:
  - `Ollama API error: 500` — Ollama is not running. Start it in another terminal: `ollama run moondream`.
  - `Module not found: 'ws'` — run `pnpm install` again.
  - Timeout errors — Ollama is too slow; you may need a faster machine or lower `requestTimeoutMs` in `ai.ts`.

### Step 3b: Run one specific test with verbose output
To see **exactly** what's happening in one test:
```bash
pnpm --filter=lazarus-engine test -- --reporter=verbose --run src/__tests__/integration.test.ts
```

**Read the output line by line:**
- `[Lazarus] Element not found` — the click failed.
- `[Lazarus AI] Fast match: ...` — Lazarus found a deterministic selector match from the visible metadata, so it did not need to wait on the model.
- `[Lazarus AI] Raw response: ...` — the model's exact reply before parsing.
- `[Lazarus AI] Falling back to heuristic match...` — the model response was not useful, so Lazarus matched the target against the visible element metadata.
- `[Lazarus AI] Found element: ... -> #...` — AI identified the element.
- `[Lazarus AST] Replaced selector in ...` — code was rewritten.
- The test then asserts the click succeeded.

---

## Phase 4: Run the E2E Demo (10 min)

This is a **standalone demo** that shows the full flow: broken selector → healing → rewritten code.

### Step 4a: Run the demo
```bash
pnpm --filter=lazarus-engine run example:e2e
```

By default, the demo runs in **vision mode** so you can see the full healing flow. If you want the faster deterministic path, use:
```bash
$env:LAZARUS_DEMO_MODE="fast"
pnpm --filter=lazarus-engine run example:e2e
```

**What to expect:**
```
[E2E] Mode: vision
[E2E] Fast match enabled: false
[E2E] Triggering broken click...
[Lazarus] Element not found. Initiating self-healing for: "Submit button"
[Lazarus AI] Raw response: ...
[Lazarus AI] Falling back to heuristic match: ...
[Lazarus AST] Could not find selector to replace in ...
[E2E] Status: Clicked via healed selector
[E2E] Demo complete.
```

### Step 4b: Inspect what changed
After the demo runs, check if the code was actually modified:
```bash
git diff packages/lazarus-engine/examples/e2e-demo.ts
```

**You should see:**
- A line where `#broken-selector` (or similar) was replaced with `#real-submit-btn`.
- This proves the AST rewriter actually modified the file.

**Reset the file after:**
```bash
git checkout packages/lazarus-engine/examples/e2e-demo.ts
```

---

## Phase 5: Run the Dashboard & See Telemetry (15 min)

### Step 5a: Start the dashboard dev server
```bash
pnpm --filter=dashboard dev
```

**What to expect:**
```
 ▲ Next.js 15.5.18
 - Local:        http://localhost:3000
 ✓ Ready in 3s
```

### Step 5b: Open the dashboard in your browser
- Go to http://localhost:3000
- You should see the **Healing Command Center** with a realtime status panel, summary cards, and a searchable event feed.

### Step 5c: Insert a test event from the database
While the dashboard is open, open a **new terminal** and run:
```bash
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_ANON_KEY="your-anon-key"
pnpm --filter=lazarus-engine exec ts-node -P tsconfig.e2e.json scripts/insert_test_event.ts
```

**Expected output:**
```
Insert result: null
Recent healing_events: [
  {
    "id": "...",
    "script_id": "22222222-2222-2222-2222-222222222222",
    "target_description": "Test insert",
    "status": "HEALED",
    ...
  }
]
```

### Step 5d: Refresh the dashboard
- Switch back to your browser at http://localhost:3000
- **Refresh the page** (Ctrl+R or Cmd+R)
- You should now see: **one event in the feed** with status "HEALED" and the target description "Test insert"
- The left sidebar should show live counts and the connection state should say `Connected` once realtime is established.

### Step 5e: Click on the event to see details
- Click the event in the feed
- A modal opens showing:
  - Left: screenshot preview or an empty-state panel
  - Right: old selector, new selector, code diff, and the stack trace

---

## Phase 6: Create Your Own Test (20 min)

Now you'll create a **minimal test script** to verify you understand the flow.

### Step 6a: Create a new test file
Create this file:
```
packages/lazarus-engine/examples/my-learning-test.ts
```

Copy this code:
```typescript
/**
 * My Learning Test - Minimal example to understand the healing flow
 */
const http = require("http");
const { chromium } = require("playwright");
const { Lazarus } = require("../src/index");

async function main() {
  // Step 1: Start a mock Ollama server
  const mockServer = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/api/generate") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        // Always return element number "1"
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ response: "1" }));
      });
      return;
    }
    res.writeHead(404);
    res.end("not found");
  });

  await new Promise((resolve) => {
    mockServer.listen(0, resolve);
  });

  const mockUrl = `http://127.0.0.1:${mockServer.address().port}/api/generate`;
  console.log("[Test] Mock Ollama server started at:", mockUrl);

  // Step 2: Create a browser page
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Step 3: Load a simple page with TWO buttons
  await page.setContent(`
    <html>
      <body style="padding: 20px; font-family: Arial;">
        <h1>Learning Test Page</h1>
        <button id="button-1" style="padding: 10px 20px; margin: 10px;">Button One</button>
        <button id="button-2" style="padding: 10px 20px; margin: 10px;">Button Two</button>
        <div id="result">Waiting for click...</div>
        <script>
          document.getElementById('button-1').addEventListener('click', () => {
            document.getElementById('result').textContent = 'Button One clicked!';
          });
          document.getElementById('button-2').addEventListener('click', () => {
            document.getElementById('result').textContent = 'Button Two clicked!';
          });
        </script>
      </body>
    </html>
  `);

  console.log("[Test] Page loaded with two buttons.");

  // Step 4: Create a Lazarus instance
  const lazarus = new Lazarus(page, {
    ollama: { apiUrl: mockUrl, model: "moondream" },
    scriptId: "test-script-123",
  });

  console.log("[Test] Lazarus initialized.");

  // Step 5: Try clicking with a WRONG selector
  // The real page has #button-1 and #button-2, but we ask for #wrong-button
  console.log("[Test] Attempting click with WRONG selector...");
  try {
    await lazarus.click("Button One", "#wrong-button");
    console.log("[Test] ✓ Click succeeded after healing!");
  } catch (error) {
    console.log("[Test] ✗ Click failed:", error.message);
  }

  // Step 6: Verify the result
  const result = await page.textContent("#result");
  console.log("[Test] Page result:", result);

  // Cleanup
  await browser.close();
  await new Promise((resolve) => {
    mockServer.close(() => resolve());
  });

  console.log("[Test] Done!");
}

main().catch((err) => {
  console.error("[Test] Error:", err);
  process.exit(1);
});
```

### Step 6b: Run your test
```bash
pnpm --filter=lazarus-engine exec ts-node -P tsconfig.e2e.json examples/my-learning-test.ts
```

**Expected output:**
```
[Test] Mock Ollama server started at: http://127.0.0.1:...
[Test] Page loaded with two buttons.
[Test] Lazarus initialized.
[Test] Attempting click with WRONG selector...
[Lazarus] Element not found. Initiating self-healing for: "Button One"
[Lazarus AI] Found element: Button One -> #button-1
[Lazarus AST] Could not find selector to replace in ...
[Test] ✓ Click succeeded after healing!
[Test] Page result: Button One clicked!
[Test] Done!
```

**Key observations:**
- Lazarus detected the broken selector.
- Lazarus showed the full vision/AI pipeline instead of shortcutting the request.
- The click succeeded with the healed selector.
- The demo keeps the broken selector dynamic so the healing logs appear every run.
- The AST rewriter may skip the demo file in this mode, which is expected.

### Step 6c: Modify the test
Now **try modifying** the test to understand more:

**Experiment 1:** Change the AI response
```typescript
res.end(JSON.stringify({ response: "2" })); // Return "2" instead of "1"
```
Run it again. Now it should click "Button Two" instead.

**Experiment 2:** Add logging to see the annotator map
Before calling `lazarus.click()`, add:
```typescript
console.log("[Test] About to trigger healing...");
```
Then look at the output — you'll see which elements were found.

---

## Phase 7: Debug & Understand Data Flow (20 min)

### Step 7a: Enable detailed logging
Open `packages/lazarus-engine/src/core/lazarus.ts` and look at the `click()` method.

You'll see console.log statements like:
```typescript
console.log(`[Lazarus] Element not found. Initiating self-healing for: "${targetDescription}"`);
console.log(`[Lazarus AI] Found element: ${targetDescription} -> ${selector}`);
```

These are what you saw in the test output. They help you **trace execution**.

### Step 7b: Add your own logging
In your test file (my-learning-test.ts), add a log after each major step:

```typescript
console.log("[Test] === Step 1: Starting mock Ollama ===");
// ... code ...

console.log("[Test] === Step 2: Loading page ===");
// ... code ...

console.log("[Test] === Step 3: Creating Lazarus ===");
// ... code ...

console.log("[Test] === Step 4: Triggering healing ===");
// ... code ...
```

Run it again and **read the log carefully**. This is how you debug.

### Step 7c: Check what the annotator actually sees
Modify your test to log the selectorMap. In `annotator.ts`, the method returns:
```typescript
async annotateDOM(): Promise<{ selectorMap: Map<number, string>; metadataMap: Map<number, unknown> }>
```
In the production version, the annotator also returns metadata for each numbered element, so the AI prompt can include the button text, aria-label, and role.

If you are running inside Vitest, do not rely on the stack trace alone to find the file to rewrite. Test runners wrap the real call site, so AST rewriting is more reliable in the standalone E2E demo or when the caller passes an explicit source file/line.

To see it, you'd need to export a test helper (which we'll skip for now), but you can **infer** what it found from the AI output: "Found element: Button One -> #button-1" means the map had an entry pointing to #button-1.

---

## Phase 8: Run the Full E2E with Telemetry (15 min)

Once you understand the pieces, run the **full demo with telemetry**:

### Step 8a: Update your .env.local
Make sure your Supabase credentials are in:
```
apps/dashboard/.env.local
```

### Step 8b: Start the dashboard
```bash
pnpm --filter=dashboard dev
```
Keep it running in one terminal.

### Step 8c: Open the dashboard
Visit http://localhost:3000 in your browser.

### Step 8d: Run the E2E demo
In a new terminal:
```bash
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_ANON_KEY="your-anon-key"
pnpm --filter=lazarus-engine run example:e2e
```

### Step 8e: Watch the dashboard
**While** the demo runs, look at your browser. After the demo completes, **manually refresh the dashboard** (F5).

You should see a new event appear in the feed:
- Target description: "Submit button"
- Status: HEALED
- Script ID: matches the demo
- If the AI cannot return a number, Lazarus now tries a metadata-based heuristic before failing. That is intentional and helps keep the demo reliable.

---

## Phase 9: Troubleshooting Checklist

If something doesn't work, check:

| Issue | What to do |
|-------|-----------|
| Tests fail with `AbortError` | The image request is taking longer than the timeout; keep `ollama run moondream` open and wait longer, or increase `requestTimeoutMs` in `src/vision/ai.ts`. The fast-path should avoid this on simple pages. |
| AI response is empty or `NOT_FOUND` | The model answered but could not identify a selector; Lazarus will now try a metadata-based heuristic before failing |
| AST rewrite points at Vitest internals or does nothing | The test runner stack is not a stable source location; Lazarus now prefers a structured callsite and falls back to the nearest selector match if the exact line drifts |
| Tests fail with "Ollama API error: 500" | Ensure `ollama run moondream` is running in another terminal |
| Tests fail with "Module not found: 'ws'" | Run `pnpm install` again; clear node_modules if needed |
| Dashboard shows "No events yet" after demo | Did you refresh the browser? Realtime may not auto-update in dev mode |
| "SUPABASE_URL not set" errors | Check your `.env.local` file has the right keys |
| AST rewriter "Could not find selector" | The selector string literal may not exist at the reported line; check the source code |
| Timeout errors in tests | Your Ollama instance is slow; try increasing `requestTimeoutMs` in `ai.ts` |

---

## What Changed in the Production Pass

- The dashboard now feels like an operations console instead of a bare list.
- The annotator cleans up its own overlays and returns metadata for each element.
- The AI step now uses a fast deterministic match first, then the model only when needed.
- Screenshots are compressed before being sent to the model, which keeps the demo responsive.
- The AST rewrite step is more resilient because it can use the nearest selector match when line numbers drift.
- The learning path now matches the real output you should expect when running the demo.

---

## Next Steps: What to Explore

Once you've run all these phases, you can:

1. **Modify the annotator** — change how selectors are generated (try ID-only, or XPath).
2. **Change the AI prompt** — make it ask different questions or expect different responses.
3. **Add new telemetry fields** — log timing, model version, or user metadata.
4. **Create a custom test** — write your own Playwright script and wrap it with Lazarus.
5. **Deploy the dashboard** — push it to Vercel or another host.
6. **Harden the AST rewriter** — add fuzzy matching or search multiple lines if exact match fails.

---

## Key Files to Review in This Order

1. **Read first:** `ARCHITECTURE.md` (overview)
2. **Run tests:** `src/__tests__/integration.test.ts` (simplest example)
3. **Understand flow:** `src/core/lazarus.ts` (orchestrator)
4. **See vision:** `src/vision/annotator.ts` (DOM annotation)
5. **See AI:** `src/vision/ai.ts` (Ollama integration)
6. **See AST:** `src/ast/rewriter.ts` (code editing)
7. **See telemetry:** `src/telemetry/logger.ts` (database logging)
8. **See dashboard:** `apps/dashboard/src/app/page.tsx` (realtime feed)

---

## Questions to Ask Yourself

As you go through each phase, ask:

- **Phase 2–3:** "Why does the test mock Ollama? What would happen if we used the real one?"
- **Phase 4:** "Where does the code actually get rewritten? Can I see the file changes?"
- **Phase 5:** "How does the dashboard receive updates? Is it polling or push-based?"
- **Phase 6:** "What happens if I return a different number from the mock AI?"
- **Phase 7:** "Can I add logging to the vision or AST modules to see their internals?"
- **Phase 8:** "Does the screenshot actually get stored in the database?"
- **Phase 9:** "What would I change to make this more robust?"

---

Good luck! Take your time, and enjoy understanding this system step by step.

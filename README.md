# 🧟‍♂️ Project Lazarus

**A self-healing, AI-powered End-to-End (E2E) UI Automation Framework.**

Project Lazarus breathes life back into broken UI tests. By combining Playwright, local Vision LLMs (Ollama / moondream), and Abstract Syntax Tree (AST) manipulation, Lazarus automatically detects test failures, visually locates the correct UI elements, interacts with them, and **permanently rewrites your test source code** so future runs succeed.

Coupled with a real-time Next.js observability dashboard, this framework drastically reduces test flakiness and maintenance overhead.

---

## 🚀 The Elevator Pitch

Traditional E2E tests break whenever developers change CSS classes or DOM structures. Project Lazarus acts as an AI co-pilot for your test suite. When a test fails to find an element:
1. It pauses and scans the screen like a human user.
2. It asks a local AI model to find the element based on its semantic intent.
3. It fixes the code for you directly in your IDE.
4. It logs the exact visual proof and code diffs to a real-time dashboard.

---

## ✨ Key Features

* **Zero-Cost Local AI:** Uses local vision models (moondream/LLaVA) via Ollama, ensuring zero API costs and total data privacy.
* **Auto-Healing AST Rewrites:** Uses `ts-morph` to surgically inject the correct selectors back into your source code without breaking your formatting.
* **Intelligent Precursor Actions:** Can automatically execute required precursor interactions (like hovering to open a dropdown) before clicking the target.
* **Real-Time Observability:** A sleek Next.js dashboard powered by Supabase Realtime streams auto-healing events, screenshots, and code diffs instantly.
* **Drop-in Playwright Wrapper:** Easily integrates into existing Playwright setups with minimal configuration.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Automation Engine** | Node.js, TypeScript, Playwright |
| **AI & Vision** | Ollama, Moondream / LLaVA |
| **Code Manipulation** | `ts-morph` (AST parsing and rewriting) |
| **Database & Telemetry** | Supabase (PostgreSQL, Realtime Subscriptions) |
| **Dashboard Frontend** | Next.js 14 (App Router), TailwindCSS, Shadcn UI |
| **Architecture** | pnpm workspaces (Monorepo) |

---

## Architecture

```
/lazarus-monorepo
├── pnpm-workspace.yaml          # Workspace configuration
├── package.json                  # Root package
├── tsconfig.json                 # Shared TypeScript config
├── ARCHITECTURE.md               # Detailed architecture
├── /apps
│   └── /dashboard                # Next.js 14 real-time dashboard
│       ├── src/app              # Next.js pages & layout
│       ├── src/components       # Shadcn/UI components
│       ├── src/lib              # Supabase client
│       └── tailwind.config.js
├── /packages
│   └── /lazarus-engine           # Core automation engine
│       ├── src/core             # Lazarus class & error catcher
│       ├── src/vision           # DOM annotator & Moondream caller
│       ├── src/ast              # ts-morph code rewriter
│       └── src/telemetry        # Supabase logger
└── /node_modules
```

---


## 🧠 How the Architecture Works

The system operates as a continuous, self-correcting loop:

1. **Execution Attempt:** The `Lazarus` wrapper attempts a standard Playwright interaction.
2. **Failure Detection:** If a `TimeoutError` occurs, the engine intercepts it and prevents the test from failing immediately.
3. **Vision Annotation:** The engine injects JS to draw bounding boxes and numeric markers around all interactive DOM elements, capturing a screenshot.
4. **AI Inference:** The annotated screenshot is sent to the local Ollama instance. The AI returns the marker number corresponding to the intended element.
5. **Self-Healing & AST Rewrite:** Lazarus interacts with the new selector. If successful, `ts-morph` locates the exact line of code in the test file and overwrites the old selector with the new one.
6. **Telemetry Sync:** The event details (old/new selector, Base64 screenshot, status) are upserted to Supabase, instantly appearing on the Next.js dashboard.

---

## 📂 Repository Structure

This project is built as a monorepo managed by `pnpm`.

* `apps/dashboard/` — The Next.js observability application.
* `packages/lazarus-engine/` — The core self-healing library.
    * `src/core/` — Main wrapper and error orchestration.
    * `src/vision/` — DOM annotator and local AI caller.
    * `src/ast/` — Source code rewriter using `ts-morph`.
    * `src/telemetry/` — Supabase logging integration.

---

## 💻 Quickstart (Local Development)

### Prerequisites
* Node.js 20+
* pnpm v8+
* Ollama running locally (`ollama run moondream`)
* *(Optional)* Supabase project for telemetry


---

## Quickstart (local dev)

1. Install dependencies

```bash
pnpm install
```

2. Start Ollama (local LLM) and load the appropriate model (e.g. `llava`/`moondream`).

3. (Optional) Configure `apps/dashboard/.env.local` with your Supabase project:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_OLLAMA_API_URL=http://localhost:11434/api/generate
```

4. Build packages and run tests

```bash
pnpm --filter=lazarus-engine build
pnpm --filter=lazarus-engine test
```

5. Start the dashboard in development

```bash
pnpm --filter=dashboard dev
```

6. Run an example script (headful) to exercise healing (examples run with ts-node)

```bash
pnpm --filter=lazarus-engine run example:travel
```

---

## Development Notes

- Tests: `pnpm --filter=lazarus-engine test` (vitest)
- Linting/formatting: project does not enforce a linter by default; please follow the TypeScript style used across files.
- AST rewriting: `packages/lazarus-engine/src/ast/rewriter.ts` uses `ts-morph` and writes files in-place. Review rewrites before committing.

---

## Debugging tips

- If the dashboard fails with a missing Next manifest or stale build artifacts, delete `apps/dashboard/.next` and rebuild.
- If screenshots are missing in the dashboard, confirm `TelemetryLogger` is running with Supabase env vars and inspect the `healing_events.screenshot_base64` column.
- If the LLM does not respond, ensure Ollama is accessible at `http://localhost:11434/api/generate` or adjust `ollama.apiUrl` in Lazarus options.


---

## Example Usage

See `packages/lazarus-engine/examples/demo-travel.ts` for a runnable example that demonstrates precursor hover actions and telemetry writes.

---

## Contributing

1. Fork and create a feature branch.
2. Keep changes focused in one package at a time.
3. Run tests and ensure CI passes.


## Usage Example

```typescript
import { Lazarus } from "lazarus-engine";
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
const lazarus = new Lazarus(page, {
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
});

// This will auto-heal if the button selector changes
await lazarus.click("Submit Button", "#old-submit-btn");
```

## Development

### Build all packages
```bash
pnpm build
```

### Run tests
```bash
pnpm test
```

### Type checking
```bash
pnpm tsc --noEmit
```

---

## License

MIT# Project Lazarus - Self-Healing UI Automation Framework

A TypeScript-based monorepo for self-healing UI automation and testing using Playwright, local vision AI (Moondream/Ollama), and real-time telemetry via Supabase.

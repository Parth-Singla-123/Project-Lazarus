# Project Lazarus

A self-healing end-to-end (E2E) UI automation framework that combines Playwright, local vision LLMs (Ollama / LLaVA), and AST-powered source rewrites to restore broken UI tests automatically and record telemetry.

This repository is a monorepo managed with pnpm and contains an automation engine package and a Next.js dashboard for observability.

---

## Quick Overview

- Core automation: packages/lazarus-engine — Playwright wrapper (`Lazarus`) that: captures annotated DOM boxes, takes screenshots, queries a local LLM for visual identification, executes precursor actions (hover/click), retries interaction, and rewrites source tests via ts-morph.
- Dashboard: apps/dashboard — Next.js App Router UI that visualizes healing events, screenshots, and AST diffs in real time using Supabase realtime.

Key goals:
- Reduce flakiness by automatically locating interactive elements.
- Persist visual context and telemetry for human review.
- Apply safe, minimal AST changes to test scripts so future runs succeed.

---

## Repository Structure

- `apps/dashboard/` — Next.js observability dashboard.
- `packages/lazarus-engine/` — core library: `src/core`, `src/vision`, `src/ast`, `src/telemetry`, `examples/`, `__tests__/`.

See source for important modules, for example:
- `packages/lazarus-engine/src/core/lazarus.ts` — main Lazarus class. ([file link](packages/lazarus-engine/src/core/lazarus.ts#L1))
- `packages/lazarus-engine/src/vision/ai.ts` — local LLM caller + parsing. ([file link](packages/lazarus-engine/src/vision/ai.ts#L1))
- `packages/lazarus-engine/src/ast/rewriter.ts` — AST injection and selector replacement. ([file link](packages/lazarus-engine/src/ast/rewriter.ts#L1))
- `packages/lazarus-engine/src/telemetry/logger.ts` — Supabase logger. ([file link](packages/lazarus-engine/src/telemetry/logger.ts#L1))
- `apps/dashboard/src/app/page.tsx` — dashboard home. ([file link](apps/dashboard/src/app/page.tsx#L1))

---

## Requirements

- Node.js 20+ (recommended)
- pnpm
- Ollama (or compatible local LLM endpoint) running the LLaVA / moondream model on `http://localhost:11434` (configurable)
- Optional: Supabase project for telemetry (realtime + table schema). See SQL in `sql/001_init_supabase.sql`.

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

Note: Examples may attempt to write telemetry to Supabase if env vars are present. When telemetry is not configured, the engine logs that telemetry is disabled and continues.

---

## How the Self-Healing Flow Works (high-level)

1. Playwright attempt: `Lazarus.click(description, fallbackSelector)` attempts `page.click(fallbackSelector)`.
2. On Timeout, `Annotator` injects DOM markers and returns a `selectorMap` + `metadataMap`.
3. A screenshot is captured and sent to the local LLM via `AICaller.identifyElement(...)` which returns either a `targetSelector` or a precursor action (hover/click + selector).
4. If a precursor is returned, Lazarus executes it (hover/click), re-scans DOM, attempts direct match, and retries the target click.
5. If the healed selector succeeds, `CodeRewriter` (ts-morph) replaces the old selector in the calling test source file and optionally injects the precursor statement above the original click.
6. `TelemetryLogger` upserts project/script rows (if Supabase is configured) and inserts a `healing_events` record with `screenshot_base64` (when available), old/new selectors, and status.

---

## Telemetry & Supabase

- The SQL schema is in `sql/001_init_supabase.sql` and creates `projects`, `scripts`, and `healing_events` (contains `screenshot_base64 TEXT`).
- To enable telemetry, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `apps/dashboard/.env.local` or pass the `supabase` config to `new Lazarus(page, { supabase: { url, anonKey }})` in examples.
- If Supabase env vars are not present, telemetry calls are no-ops and the engine runs normally.

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

---

## License

MIT# Project Lazarus - Self-Healing UI Automation Framework

A TypeScript-based monorepo for self-healing UI automation and testing using Playwright, local vision AI (Moondream/Ollama), and real-time telemetry via Supabase.

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

## Key Components

### Module A: Lazarus Engine (`packages/lazarus-engine/src/core/lazarus.ts`)
- Wraps Playwright Page with self-healing logic
- Catches TimeoutError and extracts stack trace
- Orchestrates vision → AI → AST rewriting → telemetry pipeline

### Module B: Vision Annotator (`packages/lazarus-engine/src/vision/annotator.ts`)
- Injects JavaScript to find and mark interactive elements
- Draws red bounding boxes with numbers around buttons, links, inputs
- Returns CSS selector map

### Module C: AI Caller (`packages/lazarus-engine/src/vision/ai.ts`)
- Converts screenshot to Base64
- Sends to local Ollama instance running `moondream` model
- Parses response to identify element number → selector mapping

### Module D: AST Rewriter (`packages/lazarus-engine/src/ast/rewriter.ts`)
- Uses `ts-morph` to parse source files
- Finds and replaces old selector with new AI-generated selector
- Saves modified file automatically

### Module E: Telemetry Logger (`packages/lazarus-engine/src/telemetry/logger.ts`)
- Logs all healing events to Supabase PostgreSQL
- Includes: script ID, target description, old/new selectors, screenshot, status
- Enables real-time dashboard via Supabase Realtime

### Dashboard (`apps/dashboard`)
- Next.js 14 with App Router
- Dark mode (Zinc-950 background)
- Real-time healing event feed via Supabase subscriptions
- Split-screen modal: screenshot + code diff

## Setup

### Prerequisites
- Node.js v20+ (currently installed: v20.15.1)
- pnpm v8.15.4
- Ollama with `moondream` model running locally
- Supabase project (free tier available)

### Installation

1. **Install dependencies:**
```bash
pnpm install
```

2. **Configure environment variables:**
```bash
cp apps/dashboard/.env.example apps/dashboard/.env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_OLLAMA_API_URL=http://localhost:11434/api/generate
```

3. **Start Ollama locally:**
```bash
ollama run moondream
```

4. **Setup Supabase database schema:**
Run the SQL from ARCHITECTURE.md Section 2 in your Supabase SQL Editor.

5. **Run development servers:**
```bash
pnpm dev
```

This starts:
- Dashboard on `http://localhost:3000`
- Engine ready for import in test scripts

## Tech Stack

- **Monorepo:** pnpm workspaces
- **Runtime:** Node.js + TypeScript
- **Automation:** Playwright
- **Code AST:** ts-morph
- **Vision AI:** Ollama + moondream (local inference, no API costs)
- **Database:** Supabase PostgreSQL
- **Realtime:** Supabase Realtime Subscriptions
- **Frontend:** Next.js 14, TailwindCSS, Shadcn UI, Lucide Icons

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

## Notes

- Telemetry is optional (disabled if Supabase env vars not set)
- Screenshots are stored as Base64 in PostgreSQL (max 4MB)
- Moondream inference runs locally, no external API required
- All code modifications are atomic via ts-morph AST operations

## License

MIT

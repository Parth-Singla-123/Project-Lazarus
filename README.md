# Project Lazarus - Self-Healing UI Automation Framework

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

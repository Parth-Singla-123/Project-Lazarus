1. Create a file named ARCHITECTURE.md in your empty VS Code folder and paste THIS:
code
Md
# SYSTEM DIRECTIVE FOR AI CODING AGENT
You are a Staff-Level Principal Engineer. We are building **Project Lazarus**, a self-healing UI automation and testing framework utilizing pnpm workspaces. Read the entire brief before generating code or proposing file structures.

### 1. THE WORKFLOW
1. A Playwright script attempts: `await lazarus.click('The Submit Button', '#old-btn')`.
2. The element is missing. A timeout error is caught. We capture the `error.stack` to find the exact file and line number.
3. **Vision Injection:** We inject JS via `page.evaluate()` to draw red bounding boxes with numbers (e.g., [1], [2]) around all interactive elements.
4. We take a `page.screenshot()`.
5. **Local AI Inference:** We send the screenshot (Base64) to a local Ollama instance running `moondream`. Prompt: *"Look at the numbered red boxes. Which number corresponds to '{targetDescription}'? Reply with ONLY the number."*
6. **Self-Modification (AST):** We map the number to the new selector. We use `ts-morph` to parse the file from the error stack, find the old selector string, replace it with the new selector, and save the file.
7. **Telemetry:** We log this event to a Supabase PostgreSQL database using the `@supabase/supabase-js` client.

### 2. THE TECH STACK
*   **Monorepo Tooling:** pnpm workspaces.
*   **Engine:** Node.js, TypeScript, Playwright, `ts-morph` (AST).
*   **Vision AI:** Ollama running `moondream` (Local API at http://localhost:11434/api/generate).
*   **Database & Realtime:** Supabase (`@supabase/supabase-js`). strictly NO Prisma, NO custom socket servers.
*   **Frontend Dashboard:** Next.js 14 (App Router), TailwindCSS, Shadcn UI.

### 3. MONOREPO DIRECTORY STRUCTURE
```text
/lazarus-monorepo
├── pnpm-workspace.yaml
├── package.json
├── /apps
│   └── /dashboard         # Next.js 14 App
│       ├── /src/app       # Pages
│       ├── /src/components# Shadcn components
│       └── /src/lib       # Supabase client config
├── /packages
│   └── /lazarus-engine    # The Playwright Wrapper
│       ├── package.json
│       ├── /src/core      # Playwright interceptor & Stack trace parser
│       ├── /src/vision    # DOM annotator & Moondream caller
│       ├── /src/ast       # ts-morph code rewriter
│       └── /src/telemetry # Supabase JS client to insert logs
4. EXACT MODULE IMPLEMENTATION DETAILS

Module A: The Engine & Error Catcher (packages/lazarus-engine/src/core)
Create a Lazarus class that wraps the Playwright Page object.
Implement .click(targetDescription: string, fallbackSelector: string).
Wrap standard Playwright click in a try/catch. If TimeoutError occurs, catch it.
CRITICAL: Capture error.stack to parse the exact file path and line number that called .click().

Module B: Bounding Box Annotator (packages/lazarus-engine/src/vision/annotator.ts)
Inject JS via page.evaluate() to find all button, a, and input tags.
Draw a visible red outline around them and append a numbered label (e.g., [1], [2]).
Return a JSON map mapping Number -> Generated CSS Selector.
Capture page.screenshot().

Module C: Local AI Caller (packages/lazarus-engine/src/vision/ai.ts)
Convert screenshot to Base64.
Send POST to http://localhost:11434/api/generate (Ollama API). Model must be "moondream".
Prompt: "Look at this image. I need to click the element described as: '{targetDescription}'. Reply ONLY with the number in the red box that corresponds to this element."
Parse the integer response and map it to the new CSS selector from Module B.

Module D: AST Code Rewriter (packages/lazarus-engine/src/ast/rewriter.ts)
Use ts-morph to load the source file extracted from the error stack trace.
Navigate AST to find the exact line number and the string literal argument (the old fallbackSelector).
Replace it with the new AI-generated CSS selector.
Call sourceFile.saveSync().

Module E: Supabase Telemetry (packages/lazarus-engine/src/telemetry/logger.ts)
Use @supabase/supabase-js to insert a record into the healing_events table (Fields: id, script_id, target_description, old_selector, new_selector, screenshot_base64, status).

###5. FRONTEND DESIGN DIRECTIVES & REALTIME

Aesthetic: "Linear / Vercel" style. Dark mode (bg-zinc-950). Zero clutter.
UI Library: Shadcn UI (Card, Badge, ScrollArea, Tabs, Table).
Realtime Subscriptions: Inside Next.js Client Components, use supabase.channel('custom-all-channel').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'healing_events' }, callback).subscribe(). This streams logs without WebSockets.
Layout: Sidebar for navigation. Main content is a real-time live feed of test executions.
Flagship Split-Screen Modal: Left Side: Base64 Screenshot with red boxes. Right Side: Terminal-like "Live Log" and a visual Code Diff (Old Code vs New AI Code).

AGENT INSTRUCTIONS FOR EXECUTION
Do not write all the code at once. We will build this iteratively.
Step 1: Acknowledge this brief. Confirm you understand the Supabase-only architecture, the purpose of ts-morph, and the Moondream Vision Box strategy. Do not generate code yet.
Step 2: Provide the Supabase PostgreSQL schema needed to create the tables.
Step 3: Provide the exact terminal commands to initialize the pnpm workspace, Next.js, and local packages.
Wait for my command to proceed to Step 4 (Building the Engine).
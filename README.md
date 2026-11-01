# Your Notes — Engineering Knowledge Vault

A local-first, web-native Markdown knowledge management workspace engineered with the **Obsidian Slate** design system.

## Key Capabilities

- **3-Pane Artisan Editor Workspace**: Hierarchical folder tree, bookmarks, tag filtering, multi-tab Markdown editor, collapsible YAML frontmatter properties, interactive task lists, syntax-highlighted code snippets, technical comparison matrices, and side-by-side split pane inspection.
- **Dedicated Bidirectional Linking Engine (`[[WikiLinks]]`)**: Resolves links by note filename, canonical title, or YAML aliases (`[[Target|Alias]]`, `[[Target#Heading]]`), derives incoming backlinks and outgoing links automatically, and rewrites references across the vault on note rename.
- **Interactive Knowledge Graph & Spatial Canvas**: Force-styled node-and-edge graph visualizer (`Graph Visualizer`) and spatial architecture canvas (`Canvas Board`).
- **Local-First Persistence**: Transactionally persists notes, folders, tabs, and canvas topologies to browser `IndexedDB` (`YourNotesKnowledgeVaultDB`) and `localStorage` with Markdown `.md` import/export and full `.json` vault backup.
- **High-Thinking Vault Reasoning**: Server-side `/api/ai/thinking` integration powered by `@google/genai` (`gemini-4-argon` with `ThinkingLevel.HIGH`).

## Quick Start Launcher (One-Click Localhost)

- **Windows**: Double-click `start-app.cmd` (or run `.\start-app.cmd` in Command Prompt / PowerShell). It automatically checks for `node_modules`, runs `npm install` if needed, opens `http://localhost:3000` in your default browser, and runs `npm run dev`.
- **macOS / Linux**: Run `./start-app.sh` to automatically install dependencies if needed, open `http://localhost:3000`, and start `npm run dev`.

## Scripts

- `npm run dev` — Starts the full-stack Express + Vite server on port 3000.
- `npm run test` — Runs unit tests (`tsx --test src/domain/vaultEngine.test.ts`).
- `npm run lint` — Runs TypeScript strict type checking (`tsc --noEmit`).
- `npm run build` — Builds the production client bundle (`dist/`).

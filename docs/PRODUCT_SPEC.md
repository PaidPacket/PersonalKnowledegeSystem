# Product Specification — Your Notes (Engineering Knowledge Vault)

## 1. Product Vision
Your Notes is a web-first technical knowledge management system built for software architects and systems engineers. It combines local-first Markdown longevity, bidirectional `[[WikiLink]]` knowledge graphs, spatial architecture canvases, and deep reasoning synthesis.

## 2. Core User Workflows & Acceptance Criteria
1. **3-Pane Editor Workspace**:
   - Left Explorer with Vault header, quick file filter, pinned Bookmarks, Tags (`#java/concurrency`, `#architecture/oop`, `#system-design`), and multi-level nested folders.
   - Center Editor with multi-tab management, breadcrumbs, collapsible YAML Properties, live rich mode + raw Markdown mode, interactive checklists, code blocks with copy button, comparison tables, clickable `[[WikiLinks]]`, and live word/character/read-time status bar.
   - Right Inspector with Table of Contents (`Outline`), `Backlinks` with context excerpts, `Outgoing` links, and a `Local Graph` neighborhood view.
2. **Bidirectional Linking & Rename Integrity**:
   - Clicking any `[[Note]]` opens the target note (or creates it on demand).
   - Renaming a note updates all referencing `[[WikiLinks]]` across the vault while preserving `#heading` and `|alias` modifiers.
3. **Graph Visualizer & Spatial Canvas**:
   - Interactive node-link graph filtered by tag or search query with in-degree/out-degree telemetry.
   - Spatial architecture canvas with connected cards linked to vault notes.
4. **Daily Journal & Vault Governance**:
   - Daily engineering log (`2026-11-01 Engineering Journal.md`), Markdown `.md` import/export, and full JSON backup.

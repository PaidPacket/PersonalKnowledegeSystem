# Architecture Overview

## Module Boundaries
- `src/domain/vaultEngine.ts`: Pure, zero-DOM domain engine for `[[WikiLink]]` extraction, alias/title/filename resolution, rename link rewriting, YAML frontmatter parsing/serialization, backlink/outgoing link derivation, outline extraction, document metrics, and deterministic graph layout calculation.
- `src/domain/seedVault.ts`: Deterministic initial engineering vault dataset matching the Stitch reference screens.
- `src/services/vaultStorage.ts`: Local-first persistence repository managing `IndexedDB` (`YourNotesKnowledgeVaultDB`) and synchronous `localStorage` snapshot hydration.
- `src/components/`: Modular UI components separated by workspace surface (`TopHeaderBar`, `LeftNavigationRail`, `FileExplorerSidebar`, `EditorCenterStage`, `RightInspectorSidebar`, `GraphVisualizerView`, `CanvasBoardView`, `DailyJournalView`, `VaultPreferencesView`, `CommandPaletteModal`, `HighThinkingModal`).
- `server.ts`: Express server mounting Vite middleware in development and exposing `POST /api/ai/thinking` using `@google/genai` (`gemini-4-argon` with `ThinkingLevel.HIGH`).

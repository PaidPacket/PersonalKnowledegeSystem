# Architectural Decisions (ADR)

1. **Permanent Entity IDs over Filenames**: Notes and folders use immutable IDs (`note-virtual-threads`, `folder-02-concurrency`) so renames never orphan open tabs or canvas cards.
2. **Derived Link Graph**: Backlinks, outgoing links, and graph edges are computed deterministically from note content through `vaultEngine.ts` rather than stored redundantly.
3. **Dual-Tier Local Persistence**: Synchronous hydration from `localStorage` eliminates layout flicker on first paint while asynchronous transactional writes persist snapshots to `IndexedDB`.
4. **Server-Side Gemini API with Graceful Local Fallback**: `POST /api/ai/thinking` runs on the Express backend using `@google/genai` (`gemini-4-argon`, `ThinkingLevel.HIGH`), with a deterministic local synthesis fallback when no paid API key is configured.

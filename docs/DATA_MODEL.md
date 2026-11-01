# Data Model & Persistence

## Entities
- **NoteRecord**: Identified by permanent `id` (never by mutable filename). Stores `folderId`, `filename`, `title`, `frontmatter` (`tags`, `status`, `created`, `priority`, `aliases`), structured sections (`checklist`, `codeBlock`, `comparisonTable`, `callout`), and canonical `rawMarkdown`.
- **FolderRecord**: Hierarchical folder node with `id`, `parentId`, `name`, `expanded`, and `order`.
- **Derived Link Index**: `ParsedLink` and `BacklinkMatch` records are derived from note content via `extractWikiLinks`, `computeBacklinks`, and `computeOutgoingLinks` so there is never stale duplicate link state.
- **CanvasNode & CanvasEdge**: Spatial board cards with optional `linkedNoteId` references.

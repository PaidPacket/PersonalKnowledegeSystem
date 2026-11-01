# Testing & Verification Strategy

## Unit Tests
- Run `npx --yes tsx --test src/domain/vaultEngine.test.ts` to verify:
  - `[[WikiLink]]` parsing (`[[Target]]`, `[[Target|Alias]]`, `[[Target#Heading]]`)
  - Link resolution by filename, title, and YAML alias
  - Link rewriting across notes when a target note is renamed
  - YAML frontmatter and Markdown body round-trip serialization
  - Bidirectional backlink and outgoing link derivation
  - Graph node and edge degree calculation

## Type Checking & Build
- `npm run lint` (`tsc --noEmit`)
- `npm run build` (`vite build`)

## End-to-End Browser Verification
- Verified via headless Chromium (`playwright-cli`) at 1440x900 desktop viewport across Editor Workspace, Graph Visualizer, Canvas Board, Daily Journal, Vault Preferences, and Command Palette.

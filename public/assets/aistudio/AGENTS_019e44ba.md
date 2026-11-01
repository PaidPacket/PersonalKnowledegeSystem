# Antigravity Project Rules — Obsidian-Inspired Web Knowledge App

> Purpose: persistent engineering rules for AI agents working in this repository.
> Read this file before inspecting, planning, editing, or executing project commands.
> Product requirements and roadmap live in `docs/PRODUCT_SPEC.md` and `docs/ROADMAP.md`. If they do not exist yet, create them during planning rather than inventing undocumented requirements.

## 1. Project Scope

- Build a **web-first** knowledge-management application inspired by Obsidian.
- Initial target: modern desktop browsers, with responsive support for tablet and mobile essential workflows.
- Do not build a native desktop or mobile application in the initial release.
- Keep the architecture portable enough that a desktop wrapper may be considered later, but do not add desktop-specific complexity now.
- Create an original product identity. Do not copy Obsidian branding, proprietary assets, or its interface pixel-for-pixel.
- Use **Google Stitch** as the UI/UX design tool. Treat approved Stitch designs and design tokens as the visual source of truth.
- Do not claim Stitch designs were created or inspected unless the agent actually accessed the relevant artifacts. If access is unavailable, provide a precise prompt and request/import the resulting artifacts.

## 2. Operating Principles

1. **Plan before substantial changes.** Inspect the repository and current state first; write a short plan for non-trivial tasks.
2. **Work incrementally.** Complete one milestone or narrowly scoped task at a time.
3. **Preserve working behavior.** Avoid broad rewrites and unrelated refactors.
4. **Protect user data.** Never delete, overwrite, migrate, or reset user data without explaining the consequences and obtaining approval when the operation is destructive or difficult to reverse.
5. **Be truthful about completion.** Do not claim a feature, build, test, browser check, or integration works unless it was actually executed and the result inspected.
6. **Prefer understandable solutions.** Explain significant architectural decisions and trade-offs so the project owner can learn and maintain the code.
7. **Keep documentation current.** Update relevant specs, decisions, and roadmap status when behavior or architecture changes.
8. **Do not silently guess.** If a requirement materially affects data integrity, security, or architecture, identify the uncertainty and ask for clarification or document a reversible assumption.
9. **Avoid scope creep.** Do not add unrelated features, services, dependencies, or configuration changes.
10. **Do not leave deceptive UI.** A control must work, be clearly disabled with an explanation, or be explicitly marked as a not-yet-implemented placeholder.

## 3. Technology Guardrails

Use the project-approved stack unless a concrete technical limitation is documented and the owner approves a change.

- Frontend: React, TypeScript, Vite.
- Type checking: TypeScript strict mode.
- Styling: Tailwind CSS and shadcn/ui.
- Icons: Lucide React.
- UI/application state: Zustand where shared state is warranted.
- Input/schema validation: Zod.
- Editor: Tiptap/ProseMirror, with explicit Markdown import/export.
- Local persistence: IndexedDB through Dexie or the repository's already-approved equivalent.
- Backend/cloud, when scheduled: Supabase, PostgreSQL, and Supabase Storage.
- Node-and-edge Canvas: `@xyflow/react` if appropriate.
- Graph visualization: Sigma.js and Graphology if appropriate.
- Unit/component tests: Vitest and React Testing Library.
- End-to-end tests: Playwright.

### Dependency rules

- Inspect `package.json` and the lockfile before installing anything.
- Prefer an existing dependency if it already solves the requirement well.
- Do not install multiple libraries that solve the same problem without a documented reason.
- Do not upgrade major dependency versions as unrelated cleanup.
- Use compatible, stable versions and commit the lockfile when the repository uses one.
- Do not add a library solely because it appears in a suggested stack; confirm it is needed for the current milestone.
- Do not implement complex graph layout, editor internals, authentication, or cryptography from scratch when a maintained library/service is appropriate.
- If proposing a stack change, state the problem, alternatives, risks, migration impact, and recommendation before making the change.

## 4. Architecture and Code Quality

- Keep features modular and organized by domain.
- Keep presentation components, business logic, persistence, and external-service access separate.
- Do not put the entire application in one component or file.
- Avoid giant components, giant hooks, duplicated business logic, circular dependencies, and premature abstractions.
- Use typed interfaces for repositories and services.
- Validate data at external and persistence boundaries.
- Keep derived data derived where possible; do not maintain duplicate sources of truth.
- Keep temporary UI state separate from persisted note data.
- Keep graph construction separate from graph rendering.
- Keep Markdown parsing/serialization separate from editor UI.
- Use semantic HTML and accessible interaction patterns.
- Use descriptive names and small functions with clear responsibilities.
- Handle loading, empty, error, success, and disabled states where relevant.
- Do not suppress TypeScript errors with `any`, `@ts-ignore`, or broad casts to bypass design problems. If an exception is genuinely necessary, narrow it and document why.
- Do not leave unexplained `TODO`, dead code, debug logging, or unused dependencies in completed work.

## 5. Data Integrity Rules — Critical

- Use stable IDs for notes, folders, attachments, Canvas nodes, and other entities. **Filenames are not permanent identifiers.**
- Define canonical content formats and explicit serialization/deserialization behavior.
- Do not assume Tiptap's internal JSON is Markdown.
- Test Markdown import/export round trips for supported constructs.
- Never silently discard content or ignore a failed save.
- Autosave must be scheduled/batched appropriately; do not write to storage on every keystroke without a deliberate strategy.
- Prevent stale asynchronous saves from overwriting newer edits.
- Flush or safely resolve pending writes before switching notes, closing relevant UI, or navigating where feasible.
- Make rename, move, delete, and restore operations update references and metadata consistently.
- Handle duplicate filenames, missing links, deleted targets, malformed persisted records, and attachment failures.
- Use transactions for multi-record operations where supported.
- Include schema versioning and migrations for persisted data.
- Destructive actions must be confirmed when appropriate and should be recoverable where practical.
- Never use mock or in-memory state as a substitute for persistence while claiming persistence is implemented.
- Never reset or clear IndexedDB, application data, or user files as a troubleshooting shortcut without explicit approval.

## 6. Markdown and Linking Rules

- Define and document the supported Markdown dialect and feature set.
- Preserve content that the editor does not understand whenever feasible; do not silently strip unsupported syntax.
- Keep note identity separate from display title/path.
- Resolve `[[Note]]` links through a dedicated linking service, not ad hoc string replacements scattered across components.
- Support aliases and define how ambiguous names are resolved.
- Define link behavior for renames, moves, deleted notes, missing notes, and duplicate titles.
- Keep backlinks and outgoing links derived from the canonical link model or a well-defined index.
- Rebuild or update indexes reliably when note content changes.
- Avoid full-vault rescans on every keystroke.
- Test link resolution, heading links, alias resolution, rename updates, and broken-link behavior.

## 7. Storage and Cloud Rules

### Local-first behavior

- The initial note-taking workflow must work without a cloud account.
- Use the approved local repository/data-access layer for local records.
- UI components must not directly access IndexedDB tables everywhere; route operations through repositories/services.
- Handle browser storage limitations and failures visibly.
- Explain that browser-local data can be lost if the user clears site data or removes the browser profile; provide export/backup guidance where appropriate.

### Supabase, when scheduled

- Do not implement cloud sync before local persistence and the data model are stable.
- Define SQL migrations, indexes, foreign keys, ownership relationships, and Row Level Security (RLS) policies.
- Every user-owned record must be protected against cross-user access.
- Test RLS with multiple users or representative authenticated contexts.
- Never expose a Supabase service-role key or other privileged secret in frontend code.
- Frontend environment variables are public; never put secrets in `VITE_*` variables.
- Do not claim synchronization is complete until conflict detection/resolution, deletion propagation, retries, offline behavior, authentication, and visible sync status are implemented and tested.
- Do not silently overwrite a newer version with stale content.
- Document the chosen conflict-resolution policy before implementing sync.
- Keep local-only and cloud-backed modes explicit; show actionable sync errors.

## 8. Security and Privacy

- Treat note content, filenames, attachments, and imported files as untrusted input.
- Do not render arbitrary HTML unsafely or introduce XSS through Markdown, links, previews, or imported content.
- Sanitize or safely render untrusted content using established libraries and safe framework APIs.
- Validate URLs and reject unsafe schemes such as `javascript:` where links are accepted.
- Validate file type, size, and names; do not trust client-supplied MIME types alone.
- Do not log note content, credentials, access tokens, or sensitive user data.
- Do not commit secrets, `.env` files, credentials, or private user data.
- Keep `.env.example` limited to variable names and safe placeholders.
- Use least privilege for database/service access.
- Use Row Level Security for Supabase user data.
- Do not add analytics, telemetry, external AI services, or third-party data transmission without a clear requirement and transparent disclosure.
- Do not make network requests to unapproved services.
- Explain security implications before changing authentication, access policies, or data handling.

## 9. UI/UX and Stitch Rules

- Use approved Stitch designs, screenshots, and design tokens as the visual reference.
- Do not substitute a generic SaaS dashboard for the designed note-taking workspace.
- Preserve design consistency across screens and themes.
- Build reusable components for repeated patterns.
- Do not hard-code inconsistent colors, spacing, radii, or typography when design tokens exist.
- Support light and dark themes as specified by the current milestone.
- Ensure keyboard focus, visible focus states, accessible labels, contrast, and dialog behavior.
- Make responsive behavior intentional rather than merely shrinking the desktop layout.
- Do not use a static screenshot as the application UI.
- Do not merge generated Stitch code blindly. Inspect its dependencies, semantics, responsiveness, accessibility, and compatibility before integrating it.
- Keep visual-only changes separate from persistence/business logic whenever possible.
- Do not claim pixel-perfect parity; report meaningful differences observed during browser review.

## 10. Performance Rules

- Avoid scanning every note on each search keystroke.
- Debounce search and use indexes appropriate to the active backend.
- Avoid rendering all graph nodes or list rows without considering scale.
- Use virtualization or incremental loading when measurements justify it.
- Lazy-load nonessential views and large dependencies where appropriate.
- Avoid unnecessary React state updates and expensive calculations.
- Use memoization when it addresses an observed problem, not by default everywhere.
- Keep editor typing responsive.
- Test with realistic note counts and content sizes before making performance claims.
- Do not add complex caching or infrastructure without evidence that it is needed.

## 11. Testing and Verification Rules

For each task, determine which checks are relevant and run them before reporting completion.

- Type-check the project.
- Run linting if configured.
- Run relevant unit/component tests.
- Run relevant integration tests.
- Run Playwright tests for important end-to-end workflows.
- Run a production build at appropriate milestones.
- Inspect test output and investigate failures; do not ignore failures because they predate the change without documenting that fact.
- Do not delete or weaken tests merely to make the suite pass.
- Do not change assertions to match broken behavior without a justified specification change.
- Do not claim browser verification unless the application was actually opened and the relevant flow was tested.
- If a tool, browser, or environment is unavailable, state exactly what could not be verified.
- Report commands executed and their actual outcomes.

### Minimum critical workflows

1. Create a note, type content, reload, and verify persistence.
2. Edit a note rapidly and verify the newest content wins.
3. Create and follow an internal link.
4. Verify backlinks and outgoing links.
5. Rename a linked note and verify references.
6. Search by title and content.
7. Move and delete notes and verify expected reference behavior.
8. Import/export Markdown and verify supported formatting.
9. Create and reopen a Canvas.
10. Verify user data isolation when cloud features are introduced.

## 12. Git and File Safety

- Inspect `git status` before modifying files.
- Preserve existing user changes; do not discard, reset, stash, or overwrite them without approval.
- Do not run destructive Git commands such as `git reset --hard`, force pushes, or broad cleanup commands without explicit approval.
- Do not delete files merely because they appear unused; inspect references first.
- Keep changes focused and reviewable.
- Do not commit unless asked or the project workflow explicitly authorizes it.
- Never include secrets, generated private data, database dumps, or user notes in commits.
- Before a large refactor, explain its scope and make sure there is a recoverable checkpoint.

## 13. Terminal and Environment Restrictions

- Inspect a command before running it, especially if it deletes files, changes permissions, installs system software, alters environment configuration, or modifies databases.
- Prefer project-local scripts and dependencies.
- Do not install global tools or change machine-level settings unless required and approved.
- Do not run migrations against production or a shared database without explicit approval.
- Do not clear databases, browser storage, caches containing user data, or attachment directories as a generic fix.
- Do not expose environment variables or secrets in logs, screenshots, documentation, or responses.
- If a command may be destructive or irreversible, explain the exact impact and ask first.

## 14. Milestone and Roadmap Rules

Use this order unless the owner explicitly changes the roadmap:

1. Discovery, requirements, architecture, data model, Stitch design brief.
2. UI shell based on approved Stitch designs.
3. Local notes, folders, editor, autosave, Markdown import/export.
4. Links, backlinks, aliases, tags, properties, search, navigation.
5. Daily notes, templates, bookmarks, outline, workspace preferences.
6. Graph and Canvas.
7. Bases-style structured views.
8. Authentication, cloud storage, and synchronization.
9. Accessibility, security, performance, regression testing, and deployment.

- Do not skip foundational milestones just to build visually impressive features.
- Update `docs/ROADMAP.md` and acceptance criteria at the end of each milestone.
- Track features using `NOT_STARTED`, `IN_PROGRESS`, `IMPLEMENTED`, and `VERIFIED`.
- `IMPLEMENTED` means code exists; `VERIFIED` means relevant acceptance checks passed.
- Do not mark a milestone complete while critical tests fail or data-integrity risks remain unresolved.

## 15. Required Documentation

Maintain these documents as the project evolves:

- `README.md` — setup, scripts, architecture overview, and usage.
- `AGENTS.md` — these persistent agent rules.
- `docs/PRODUCT_SPEC.md` — product scope and acceptance criteria.
- `docs/ARCHITECTURE.md` — module boundaries and data flow.
- `docs/DATA_MODEL.md` — entities, relationships, and persistence.
- `docs/UI_DESIGN.md` — Stitch references, design tokens, and responsive rules.
- `docs/ROADMAP.md` — milestones, status, and blockers.
- `docs/DECISIONS.md` — architectural decisions and trade-offs.
- `docs/TESTING.md` — test commands and verification strategy.
- `.env.example` — safe environment variable template.

Do not create empty documents just to satisfy the list. Populate them with accurate information as it becomes available.

## 16. Definition of Done

A task is done only when all applicable criteria are satisfied:

- The requested behavior is implemented.
- The implementation fits the approved architecture and design.
- Persistence works if required.
- Loading, empty, error, and destructive-action states are handled.
- Relevant tests were run and inspected.
- Type checking, linting, and build checks pass where configured and applicable.
- No known critical regression was introduced.
- Documentation and roadmap status are updated.
- Any remaining limitation or unverified behavior is stated explicitly.

## 17. Required Final Report for Each Task

At the end of each task, report:

1. **Implemented:** concise list of actual changes.
2. **Files changed:** key files and their purpose.
3. **Verification:** commands/tests run and actual results.
4. **Not implemented:** anything deferred or still mocked.
5. **Risks and limitations:** known issues or unverified behavior.
6. **Roadmap:** current milestone and next recommended task.

Keep reports concise but specific. Never equate code generation with successful verification.

## 18. First-Run Instruction

On the first run, inspect the repository and report its current state. Then complete planning only:

- Product requirements summary.
- Architecture proposal.
- Data model and relationship diagram.
- MVP versus later-feature breakdown.
- Technical risks and assumptions.
- Google Stitch prompt and screen checklist.
- Proposed folder structure.
- Milestone and testing plan.

Do not implement the full application during this first task. Wait for the project owner's review before starting the UI shell.

# plugins/file/commands/view architecture

Provides the file view command that previews workspace-relative files with path validation, size-bounded reading, binary detection, and dual CLI/web output handling.

## Architectural role

Read-only preview command dispatched by adapter.ts/handleFile. It complements create/edit/delete/rename/tree/search and isolates bounded, validated reads from mutations. Handler.ts owns reading; child renderers own code highlighting, copy, inline editing, breadcrumbs, and timeline presentation.

## Source map

- `adapter.ts` — Adapts parsed view arguments to handleViewCommand and renders results as CLI text or web nodes, parsing path, previousDir, line and lineScrollToken with workspace-root resolution.
- `definition.ts` — Defines the view subcommand metadata requiring a workspace-relative path argument with optional previousDir and line options.
- `handler.ts` — Implements workspace-bounded file viewing with escape, not-found and directory checks, null-byte binary detection, and 256KB truncation returning a structured FileViewResult.

## Integration details

- `adapter.ts` — Adapter seam between the centralized file dispatcher and this command's handler/renderers. Resolves workspace root and parses path/previousDir/line/lineScrollToken before calling handleViewCommand, then branches to CLI text or WebNodeRoot rendering via renderers - the dual CLI/web adaptation pattern shared across file/git commands.
- `definition.ts` — Declares the required workspace-relative path and optional previousDir/line fields for plugin registration and help aggregation.
- `handler.ts` — Core execution logic called by the adapter, encapsulating workspace containment guards (escape/not-found/directory), null-byte binary detection and 256KB truncation into a structured FileViewResult. Provides the safe, side-effect-free read counterpart to mutating file commands, leaving CLI/web presentation to adapter/renderers.

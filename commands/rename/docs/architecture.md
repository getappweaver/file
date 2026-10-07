# plugins/file/commands/rename architecture

Implements workspace file/folder rename within its current directory via subcommand definition, validated filesystem rename with workspace containment checks, and adapter to handler and web UI tree rendering.

## Architectural role

Leaf mutation member of the workspace file-operations family (create/delete/edit/view/tree/search) within the 20-subcommand commands aggregation. Provides the constrained same-directory rename variant — distinct from general move — and plugs into the parent's validate-containment → execute → adapt lifecycle via the centralized dispatcher fan-out (adapter.ts/handleFile), reusing shared workspace-root resolution, containment/IGNORE filtering and CLI-vs-web rendering without owning shared logic itself. No child directories.

## Source map

- `adapter.ts` — Validates path and name arguments, resolves workspace root, delegates to handleRenameCommand, and returns error text or CLI confirmation or web tree render with reveal path and preserved UI options.
- `definition.ts` — Defines rename subcommand with required path and name string arguments and optional treeDir, ext, and expanded web UI options.
- `handler.ts` — Validates new name as single segment without slashes, checks workspace containment and existence, and performs renameSync returning ok/error with relative paths.

## Integration details

- `adapter.ts` — Boundary adapter between centralized dispatcher and handler — resolves workspace root, validates path/name args, delegates to handleRenameCommand, then branches to error text, CLI confirmation, or web tree render with reveal path and preserved treeDir/ext/expanded UI state, following the standard file-command adapt pattern.
- `definition.ts` — Declarative registration contract for the rename subcommand within the file plugin command surface — exposes required path + single-segment name and optional web projection options (treeDir, ext, expanded) to keep CLI/web shape consistent with sibling file commands.
- `handler.ts` — Core execution guard enforcing same-directory invariant (single segment, no slashes), workspace containment and existence checks, then renameSync with normalized relative-path ok/error results — isolates filesystem mutation from adapter presentation logic.

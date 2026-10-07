# plugins/file/commands/delete architecture

Implements the delete/remove workspace file command via a CLI definition, a workspace-scoped filesystem handler that validates and removes targets, and an adapter that bridges CLI/web inputs to handler execution and web tree rendering.

## Architectural role

Deletion command in the filesystem-operations family, invoked through handleFile. It follows shared containment validation before rmSync and refreshes the parent directory's tree representation after execution.

## Source map

- `adapter.ts` — Adapts the delete command by validating the path argument, resolving the workspace root, delegating to handleDeleteCommand, and returning either an error/confirmation string or a refreshed web tree via renderTreeForWeb.
- `definition.ts` — Defines the delete subcommand (alias remove) with required path argument and optional --tree-dir, --ext, and --expanded web UI options.
- `handler.ts` — Implements handleDeleteCommand to validate and normalize workspace-relative paths, reject root/escape/missing targets, and delete the target with rmSync returning normalized relativePath and parentDir.

## Integration details

- `adapter.ts` — CLI/web boundary adapter for delete; implements the standard file-command adapter contract — validates path presence, resolves workspace root via shared helpers, delegates to handler, and branches to CLI confirmation/error strings versus renderTreeForWeb refresh to keep web UI in sync after mutation.
- `definition.ts` — Commander declaration that registers the delete/remove alias and required path plus shared web projection options (--tree-dir/--ext/--expanded); defines the invocation contract consumed by the central dispatcher and adapter to scope post-delete tree rendering consistently with other file commands.
- `handler.ts` — Containment-enforced filesystem primitive for the folder; centralizes workspace-relative normalization and hard rejects for root/escape/missing before rmSync, returning relativePath/parentDir to support adapter error handling and tree anchoring — the safety pattern shared with other mutating file operations.

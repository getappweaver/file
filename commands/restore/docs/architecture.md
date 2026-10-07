# plugins/file/commands/restore architecture

Implements the file restore command that restores a single workspace-relative git file to HEAD via git restore, deleting untracked/newly-added files and re-checking tracked files.

## Architectural role

Targeted single-file HEAD restore alongside diff/history/commit/init. It validates workspace containment, executes Git, and adapts results for CLI and web tree/file views.

## Source map

- `adapter.ts` — Adapter extracts file from jsonPayload or parsed arguments and repositoryPath, resolves workspace root, and returns restoreGitFile result text or a validation error string.
- `definition.ts` — Defines restore subcommand metadata with name restore, summary about restoring one changed file to HEAD or deleting if untracked, and a required workspace-relative file string argument.
- `handler.ts` — Implements workspace-contained restore via path validation, HEAD tracking check with git cat-file, staged unstage with git restore --staged, and deletion or git restore to HEAD.

## Integration details

- `adapter.ts` — CLI/web adaptation shim for the restore subcommand — extracts the workspace-relative file target from jsonPayload or parsed args with repositoryPath fallback, resolves workspace root via shared helper, delegates to handler's restoreGitFile, and normalizes success/error to text for the dispatcher/bot response. Thin bridging layer consistent with other file/git command adapters.
- `definition.ts` — Declarative registration contract that exposes restore to the file plugin's command parser, dispatcher, and help renderer. Defines the single required workspace-relative file argument and summary string, establishing the invocation shape validated by adapter/handler and surfaced in help without containing execution logic.
- `handler.ts` — Core execution engine owning containment and mutation logic — validates workspace boundary, probes HEAD tracking via git cat-file -e to branch between delete-if-untracked and unstage-via-restore---staged plus restore-to-HEAD, encapsulating all git CLI side effects and path-safety guarantees isolated from adapter rendering.

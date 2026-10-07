# plugins/file/commands/history architecture

Implements the file `history` subcommand that shows recent git commits for a workspace-relative path, handling path resolution, git log execution, and CLI/web result rendering.

## Architectural role

Read-only, path-scoped Git log inspection alongside diff/commit/restore/init. It validates workspace/repository containment, executes Git in handler.ts, and delegates presentation and diff actions to its renderer.

## Source map

- `adapter.ts` — Adapts parsed history command params to `handleHistoryCommand` (maxCount 20) and renders the result as CLI text or web node via `renderFileHistoryWeb`.
- `definition.ts` — Defines the `history` subcommand with optional workspace-relative `path` argument and example invocations.
- `handler.ts` — Resolves and validates the workspace path, verifies git repository, runs `git log` with relative dates and parses `git show --numstat` stats into `FileHistoryResult`.

## Integration details

- `adapter.ts` — Dispatch and presentation fork for this subcommand — invoked from the central file dispatcher, hardcodes maxCount 20 for handleHistoryCommand, and branches results into CLI text vs web tree via renderFileHistoryWeb; sole bridge between parsed params, handler execution, and renderers output.
- `definition.ts` — Declarative contract for the history subcommand registered via the file plugin init flow; exposes the optional workspace-relative path argument and example invocations that drive help generation and param validation for the adapter/handler chain.
- `handler.ts` — Execution core for the subcommand implementing the shared workspace-resolution → git-repo verification → git log (relative dates) + git show --numstat parsing pipeline; produces the typed FileHistoryResult with per-commit file/addition/deletion metrics consumed by adapter and web renderers.

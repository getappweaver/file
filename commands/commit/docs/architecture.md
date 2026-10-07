# plugins/file/commands/commit architecture

Implements the file `commit` command that validates the selected changed files and index state, stages/unstages to match the selection, and creates a git commit with the provided message.

## Architectural role

Git commit command invoked through handleFile. It closes the inspect-via-diff/history → persist loop, using shared workspace/repository containment and isolating transactional Git logic in its handler while the adapter formats CLI/web results.

## Source map

- `adapter.ts` — Adapts FileCommandAdapterParams into a commitSelectedFiles call by extracting message and file selections from JSON payload or arguments, resolving the repository root, and formatting the result as text.
- `definition.ts` — Exports the `commit` subcommand definition with a required variadic string `message` argument for committing selected git diff files.
- `handler.ts` — Implements commitSelectedFiles to validate message and selection, verify the staged index matches expected state, sync staging via git add and restore --staged to the selected changed files, and create the commit returning hash, summary, and committed files.

## Integration details

- `adapter.ts` — CLI/web adaptation edge for this leaf — translates FileCommandAdapterParams (JSON payload or variadic args) into handler's commitSelectedFiles domain call, resolves repository root, and formats result as text. Implements the shared validate-containment → execute → adapt pattern, keeping transport/parsing separate from git mutation in handler.ts.
- `definition.ts` — Declarative registration contract for the file plugin's command container — exports the variadic string `message` argument definition that defines the external CLI shape. Enables discovery/routing by init.ts and the central dispatcher without owning execution, bridging user invocation to adapter.ts/handler.ts.
- `handler.ts` — Transactional core and only state-mutating file in this directory — owns message/selection/index-state validation, reconciles staging via git add / restore --staged to match selected changed files, and creates the commit returning hash/summary/committed files. Depends on adapter-provided inputs and complements read-only siblings diff/history and inverse operation restore.

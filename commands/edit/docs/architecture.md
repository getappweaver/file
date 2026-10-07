# plugins/file/commands/edit architecture

Implements the `edit` workspace file command that validates a relative path, overwrites an existing file with new content, and adapts output to a timeline diff for web or a confirmation message otherwise.

## Architectural role

Overwrites an existing workspace file through the centralized dispatcher. It applies shared workspace/path validation, performs the write, and adapts the result for CLI/web consumers and timeline diff inspection. It complements create, rename, delete, and view.

## Source map

- `adapter.ts` — Adapter parses `path`/`content` arguments, resolves the workspace root, invokes the edit handler, and returns a timeline diff rendering for web or an `Updated <path>` message otherwise.
- `definition.ts` — Defines the `edit` subcommand schema with required `path` and variadic `content` arguments, optional `--previous-dir` option, and usage example.
- `handler.ts` — Validates the relative path against workspace escape, existence, and file type, then overwrites the file with `writeFileSync` and returns the normalized relative path.

## Integration details

- `adapter.ts` — Adaptation layer that bridges the dispatcher-registered definition to the handler. Parses path/content/previous-dir, resolves workspace root via shared helper, invokes the validation/write handler, and branches output to timeline diff rendering for web vs Updated <path> confirmation for CLI, fulfilling the adapt phase of the family's pipeline.
- `definition.ts` — Declarative CLI contract consumed by the file plugin's registration and help system. Defines required path and variadic content arguments plus optional --previous-dir navigation context with usage example; provides schema for adapter parsing but contains no validation or filesystem logic.
- `handler.ts` — Core filesystem mutation enforcing containment and preconditions. Validates normalized relative path against workspace escape, existence, and file-type, then performs synchronous overwrite via writeFileSync and returns the normalized path for adapter diff rendering; isolates side-effecting write from CLI/web adaptation.

# plugins/file/commands/diff architecture

Implements the file `diff` command for previewing workspace-relative git diffs, handling single-file and timeline/commit variants with repository resolution, truncation limits, and CLI/web rendering.

## Architectural role

Read-only inspection leaf within the git-operations family of the plugins/file/commands aggregation. Positioned beneath the centralized file dispatcher (plugins/file/adapter.ts/handleFile) and registration (init.ts) seam alongside commit/history/restore/init, it provides non-mutating preview complementary to those mutating peers. Follows the shared validate-containment/repository-resolution → execute → adapt pattern via shared/ helpers, fans out internally across single-file/timeline/commit variants, and delegates all web presentation to renderers/ while keeping CLI output in the adapter layer.

## Source map

- `adapter.ts` — Implements adaptDiffCommand that validates path/repository/timeline/commit options, resolves the file repository root, delegates to handleDiff/handleTimeline/handleCommit handlers, and renders web or CLI output.
- `definition.ts` — Defines diffDefinition factory for the `diff` subcommand with required path argument and optional previousDir, timeline, commit, and repository options.
- `handler.ts` — Implements handleDiffCommand, handleTimelineDiffCommand, and handleCommitTimelineDiffCommand that resolve workspace paths, run git diff/status via spawnSync, handle untracked/binary/truncation (256KB limit), and parse patches into structured results.

## Integration details

- `adapter.ts` — Orchestration/selection layer for the diff subcommand — validates mutually exclusive path/repository/timeline/commit options, resolves the file's repository root via shared workspace utilities, fans out to the three handle* handlers, and adapts structured results to CLI text or web UI via renderers/. Depends on definition.ts contract upstream and isolates rendering from git execution in handler.ts.
- `definition.ts` — Registers diff with its required path and optional previousDir/timeline/commit/repository fields for parsing and help generation; it contains no Git execution or rendering logic.
- `handler.ts` — Stateless git execution core called by adapter.ts — resolves workspace-relative paths, invokes git diff/status via spawnSync, handles untracked/binary/truncation (256KB) edge cases, and parses patches into structured results for timeline, commit-timeline, and single-file variants. Supplies renderer-agnostic data consumed by adapter/renderers without owning CLI/web formatting.

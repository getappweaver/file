# plugins/file/commands/search architecture

Implements the `file search` command for workspace content search, defining its CLI contract, executing ripgrep with path/extension/regex filtering and limit/truncation handling, and adapting results for CLI text and web UI.

## Architectural role

Read-only content search through handleFile with shared workspace validation and ignore filtering. Child renderers own grouped results, breadcrumbs, and timeline integration.

## Source map

- `adapter.ts` — Adapts parsed search params (keyword/ext/path/regex) to handleSearchCommand with workspace root resolution and limit 100, rendering CLI text via searchResultToCliText or Web nodes via renderFileSearchWeb based on params.source.
- `definition.ts` — Defines the `search` subcommand schema with variadic required keyword argument, --ext/--path/--regex options, and example invocations under the given prefix/alias.
- `handler.ts` — Executes ripgrep (--json, --line-number, --column, --smart-case, fixed-strings/regex, ext globs, exclusions) against a validated workspace-relative target and parses JSON lines into normalized FileSearchResult with limit/truncation.

## Integration details

- `adapter.ts` — Dispatch-adaptation bridge for the search vertical — resolves workspace root, applies the fixed limit 100, and forks to CLI text (searchResultToCliText) versus web nodes (renderFileSearchWeb in child renderers/) based on params.source, keeping execution in handler.ts presentation-agnostic.
- `definition.ts` — Schema/contract entry point for registration through the commands container into the central dispatcher — declares the variadic keyword and --ext/--path/--regex surface and examples, consumed by adapter/handler without owning validation or execution.
- `handler.ts` — Pure execution engine for the vertical — owns ripgrep --json invocation with smart-case/fixed-strings vs regex, ext globs and exclusions against a validated workspace-relative target, plus JSON-lines parsing into normalized FileSearchResult with limit/truncation, intentionally decoupled from adapter rendering and renderers/ UI.

# plugins/file/commands/help architecture

Handles file plugin help output by adapting parsed help requests to rendered text and providing formatted file subcommand usage and command definition.

## Architectural role

Help introspects the registered command definitions and presents their usage for
CLI/web discovery. It performs no filesystem, Git, ripgrep, or Blossom I/O.

## Source map

- `adapter.ts` — Adapts the file help command by building a help subcommand representation from adapter params and returning rendered help text or the error message.
- `module.ts` — Exposes file help lines and command definition via commandDefinition, formatting subcommand usage strings from arguments, options, and summaries.

## Integration details

- `adapter.ts` — Dispatch-facing adapter implementing the shared CLI/web file-command contract for this aggregation. Entry point invoked via the parent handleFile fan-out; builds the help subcommand representation from adapter params and delegates content to module.ts, isolating rendering/error handling from definition — mirroring sibling adapters but bypassing workspace-containment validation and side effects.
- `module.ts` — Canonical content owner for file-plugin help within the aggregation. Centralizes commandDefinition and usage-line formatting (arguments/options/summaries → strings) as the single source of truth consumed by both adapter.ts for rendering and the plugin registration layer, keeping help synchronized with the 20-subcommand catalog without duplicating metadata.

---
direct_hash: 4257f44b87ef81ef14c9b05045816004ff4fefee255784e233a9aa2b4c4829a0
subtree_hash: d03fc7198caa796e0dec214bc64ab3f88d348e8b82bfa53b6fa02685dbeef38a
files:
  adapter.ts: bdde998ad4a6259867e5a7417b8b29722539d3ebb36b99b23f1903821cba303f
  definition.ts: d6ac1c4c2ad779b6fa95b614ac8ccf228490ca3cc864333d28875dcc810b5485
children:
---
# commands/bottomup_context

## Purpose
Command adapter for the `bottomup_context` subcommand. It turns CLI arguments and options into a read-only `bottomup_context` tool call, returning contextual `__BOTTOMUP.md` documentation from nearby directories for AI and documentation workflows.

## Files
- `adapter.ts` - CLI adapter that parses arguments/options, executes the `bottomup_context` tool, and returns the result as a message representation.
- `definition.ts` - Defines the subcommand schema: `workingDir` argument plus context-selection options such as `scopeRoot`, `parents`, `children`, `ignore`, `includeHidden`, and `noGitignore`, with usage examples.

## Notes
- Part of the dm-bot file plugin’s CLI command system.
- Read-only companion to `bottomup` and `summarize`: it retrieves surrounding documentation context rather than generating new `__BOTTOMUP.md` files.
- Uses shared parsing utilities from `../shared/`.

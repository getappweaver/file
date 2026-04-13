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
Command adapter for the bottomup_context subcommand. Adapts CLI arguments and options to execute the bottomup_context tool and return a message result.

## Files
- `adapter.ts` - CLI adapter that parses arguments/options and executes the bottomup_context tool, returning a message result.
- `definition.ts` - Defines subcommand schema: arguments (workingDir), options (scopeRoot, parents, children, ignore, includeHidden, noGitignore), and examples.

## Notes
- Part of the dm-bot CLI command system
- Uses shared parsing utilities from ../shared/

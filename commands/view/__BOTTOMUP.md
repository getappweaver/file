---
direct_hash: 7519ef7e010a1ab0f3bcd45ac78345cd67166b912bfc12f2a1d8502684027a3b
subtree_hash: 9aa10a97f0f5e4f18ada2b2933aa2a95491879f6b0aeb378286cb78fc7763159
files:
  adapter.ts: e36ef732c51d76446091a17061fdcd9a25bfdf186c4091aa95fef0c5c8198bd1
  definition.ts: 13c3317d8698727887eb506b27f7633671d667bcd4116ee0d3a41fef9a8fac41
  handler.ts: cb41645bd637701fe9aa2c9a41928a096a8fe3ebd3279bf307c4c154433c9e01
children:
  renderers: 1bea535d9da902dcc4099a7025fa45d079a4f633df771c8c712865086ae195ad
---

# commands/view

## Purpose
File viewer subcommand. Reads files from the active workspace, detects binary content, handles truncation, and returns either CLI text or generic `WebNodeRoot` output. Within the file plugin, it is the file-content surface in the shared tree/view/diff browsing flow used by both direct command execution and web navigation.

## Files
- `adapter.ts` - Command adapter - parses the path argument, resolves the workspace root, calls the handler, and formats the result as a standard message response
- `definition.ts` - Subcommand definition - declares `view`, its required `path` argument, and the optional `--previous-dir` navigation hint used by the browsing flow
- `handler.ts` - Core logic - validates workspace-relative paths, reads files, detects binary content, handles truncation, and returns typed success/error results

## Notes
- `handler.ts` is the core read/validation layer for this command.
- This command is the file-content counterpart to sibling `tree` and `diff` commands in the plugin’s workspace browsing surface.
- Web output is provided via the `renderers/` subdirectory and plugs into the broader tree/view/diff navigation flow.
- Paths must stay relative to the resolved workspace root, keeping reads workspace-bounded.
- The web path follows the repo’s generic `WebNodeRoot` rendering model rather than adding plugin-specific frontend behavior.

## Subdirectories
- `renderers/` - Web renderers for file view output

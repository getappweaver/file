---
direct_hash: 2c24f3db3d8cf3f268fecb16fc649e7bdd2a21cb40b91bd9476fa292990231c9
subtree_hash: a9ede02056a982519fb50f21754231249fa20a7e946869257e94d358df65afc2
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
  adapter.ts: 7314197cfb566e3948a581838c66d3ce2f0b16a9e1b6bcf378ba5844dd0457ff
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

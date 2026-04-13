---
direct_hash: 2c24f3db3d8cf3f268fecb16fc649e7bdd2a21cb40b91bd9476fa292990231c9
subtree_hash: a9ede02056a982519fb50f21754231249fa20a7e946869257e94d358df65afc2
files:
  adapter.ts: 7314197cfb566e3948a581838c66d3ce2f0b16a9e1b6bcf378ba5844dd0457ff
  definition.ts: 13c3317d8698727887eb506b27f7633671d667bcd4116ee0d3a41fef9a8fac41
  handler.ts: cb41645bd637701fe9aa2c9a41928a096a8fe3ebd3279bf307c4c154433c9e01
children:
  renderers: 1bea535d9da902dcc4099a7025fa45d079a4f633df771c8c712865086ae195ad
---

# commands/view

## Purpose
File viewer subcommand. Reads files from workspace, detects binary content, handles truncation, returns either CLI text or WebNodeRoot output.

## Files
- `adapter.ts` - CLI adapter - parses path arg, resolves workspace root, calls handler, formats result as text message
- `definition.ts` - Subcommand definition - declares 'view' name, required 'path' argument, optional --previous-dir option
- `handler.ts` - Core logic - validates path, reads file via fs, detects binary, handles truncation, returns ok/error result

## Notes
- Uses handler.ts for core file reading logic
- Web output via renderers subdirectory
- Path must be relative to workspace root

## Subdirectories
- `renderers/` - Web renderers for file view output

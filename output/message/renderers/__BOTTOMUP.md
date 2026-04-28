---
direct_hash: 0501e5040e1b539ff6fb07b9f78a9a70617d3d5ffcc91ab6cdcbf09d92b7b3a3
subtree_hash: 2836153cf9920457742ee0adbb16fc73e268fed61000a9ffc3b07191daef8e45
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
  cli.ts: ed80f45e71651f0673598071da9e75bde649419058561e48d33aafce27ee07d7
children:
---
# output/message/renderers

## Purpose
CLI text renderer for the file plugin’s generic message representation. It returns the message body without extra formatting and is used for command responses that flow through the shared representation/rendering path rather than specialized tree/view/diff web renderers.

## Files
- `cli.ts` - Returns raw `MessageRepresentation.data.text` for terminal/console output

## Notes
- Minimal pass-through renderer for generic command messages
- Sits at the end of the plugin’s shared message-output pipeline used by adapters that emit `message` representations
- Distinct from the structured WebNode-based renderers used by richer file-browsing commands such as tree, view, and diff

---
direct_hash: 0501e5040e1b539ff6fb07b9f78a9a70617d3d5ffcc91ab6cdcbf09d92b7b3a3
subtree_hash: 2836153cf9920457742ee0adbb16fc73e268fed61000a9ffc3b07191daef8e45
files:
  cli.ts: ed80f45e71651f0673598071da9e75bde649419058561e48d33aafce27ee07d7
children:
---

# output/message/renderers

## Purpose
Simple CLI text renderer that returns message text directly without formatting.

## Files
- `cli.ts` - Returns raw message text as-is from MessageRepresentation.data.text

## Notes
- Minimal renderer - just passes through raw text
- Used for terminal/console output mode

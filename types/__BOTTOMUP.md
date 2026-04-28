---
direct_hash: 1a75e608e33de287c7e6f9a8f271fc91cfb941f4c555bf506cca30b311fbcf1a
subtree_hash: 194e58ef133d2b83455f5dfd80b9ca6604821c96c7282bbff56e44b77542138d
files:
  adapter-params.ts: e9bb76f1f5713ed609dc806e97c76efcf20bc94c80c9542336620930de9359e2
children:
---

# types

## Purpose
This types folder holds local TypeScript contract types for command adapter integration. It defines the parameter shape passed into the file-command adapter layer, tying together message source, parsed CLI input, command metadata, and adapter identity values.

## Files
- `adapter-params.ts` - Defines the typed parameter object used when invoking the file command adapter, bundling prefix, alias, message source, parsed CLI input, and the resolved file-command definition.

## Notes
- Focused on adapter call contracts, not implementations.
- Uses imported command and parser types to keep adapter inputs aligned.

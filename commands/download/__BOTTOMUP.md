---
direct_hash: 0c9b0cdb1a4f91e99a2d66d17af3f97f3f5407d7c6ef350e670a10c78e66cfa4
subtree_hash: c2129fd68a2207394531a92326bde4ecbf2e34969b4e8f06890f89a5dfdf9bc7
files:
  adapter.ts: 3d179441784dc65bc8fcac2d38242d36f01f3be0c6a49bf96a2b481588f8b6f8
  definition.ts: 29005d59a4bca632610ab7f8227a5aa39c29cecd4f403e7af415faebedfb8232
  handler.ts: 29f6a798406c3081c3a685b85c01c1caa782c05d3cce6a6c1656bfc63a73f270
  sync.ts: 58a9cf4523b00cc43940b23ae4df8a5831baa13e8cda1689996c03bfbc03b4b2
children:
---

# commands/download

## Purpose
Implements the `/download` subcommand for downloading and decrypting shared files by naddr into the workspace. Handles Nostr event lookup, Blossom blob download, AES-GCM decryption via NIP-44, and writes files with conflict detection.

## Files
- `adapter.ts` - Command adapter: validates CLI input, invokes handler, formats responses as user messages
- `definition.ts` - Subcommand schema: defines download command, naddr argument, usage examples
- `handler.ts` - Command orchestrator: validates naddr, resolves workspace path, invokes sync, returns typed results
- `sync.ts` - Core download logic: decodes naddr, fetches kind:3219 event from relays, downloads blob from Blossom, verifies hashes, decrypts via NIP-44 AES-GCM, writes file with conflict detection

## Notes
- Requires naddr argument pointing to a kind:3219 file share event
- Uses NIP-44 v2 conversation key for decryption
- Detects local file conflicts and saves divergent versions as .incoming

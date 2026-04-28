---
direct_hash: 164e46e79da07ee8f373e7cffff670927dc17cf314e566cc43e1231bb6f12fbd
subtree_hash: 09aa49f038e8245444a6994f5fe0633baffc97f13ec4d6037ccbf13fd9b96154
files:
  adapter.ts: 7adb97a646ca3cac68f1a58105371405e944c9c37dd364829b7c0cf34380f197
  definition.ts: 29005d59a4bca632610ab7f8227a5aa39c29cecd4f403e7af415faebedfb8232
  handler.ts: 29f6a798406c3081c3a685b85c01c1caa782c05d3cce6a6c1656bfc63a73f270
  sync.ts: 58a9cf4523b00cc43940b23ae4df8a5831baa13e8cda1689996c03bfbc03b4b2
children:
---

# commands/download

## Purpose
Implements the `download` subcommand for importing a shared file into the workspace from a Nostr file-share reference. Within the file plugin, it is the receive-side counterpart to `upload`: it resolves the share event, downloads the encrypted Blossom blob, decrypts it, and writes the result into the workspace with conflict protection.

## Files
- `adapter.ts` - Command adapter: validates CLI input, invokes handler, and formats responses as user messages
- `definition.ts` - Subcommand schema: defines the download command, its naddr argument, and usage examples
- `handler.ts` - Command orchestrator: validates the naddr, resolves the workspace destination, invokes sync, and returns typed results
- `sync.ts` - Core download logic: decodes the naddr, fetches the file-share event from relays, downloads the blob from Blossom, verifies hashes, decrypts via NIP-44/AES-GCM, and writes the file with conflict detection

## Notes
- Read/write command in the otherwise stateless file plugin: unlike draft-based plugins, downloads execute immediately.
- Requires an naddr pointing to a shared-file event published by the complementary upload flow.
- Uses the NIP-44 v2 conversation key to recover the file key, then AES-GCM to decrypt the downloaded blob.
- Detects local file conflicts and preserves divergent incoming content as a `.incoming` file instead of overwriting silently.

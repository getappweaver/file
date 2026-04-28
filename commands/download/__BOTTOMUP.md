---
direct_hash: 0c9b0cdb1a4f91e99a2d66d17af3f97f3f5407d7c6ef350e670a10c78e66cfa4
subtree_hash: c2129fd68a2207394531a92326bde4ecbf2e34969b4e8f06890f89a5dfdf9bc7
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
  adapter.ts: 3d179441784dc65bc8fcac2d38242d36f01f3be0c6a49bf96a2b481588f8b6f8
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

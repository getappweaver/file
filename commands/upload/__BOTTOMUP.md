---
direct_hash: 99ffadc09495557e17d35bbd2f8145e6d5d5ae77b140b043c95e5d4318963270
subtree_hash: 69ad2deaab9cb5ff3b6cd8f3d1b1cc8dbe720c2a06119bebf42681f6b2b67800
files:
  adapter.ts: 150640efeb750f6fb3b952d75bf5c8685b1e70ab6ff414f55d1516c7b2e1928c
  definition.ts: d05534507d88624373da6fb53b39d0d047c29ae62951f7529dcdad50f6a79a8c
  handler.ts: a6f15431cc8d317b76f90ba2663b587dc7028f653d5f6570cde28740c50ebf9f
  sync.ts: 0c7ae80bad212b06a25e45222abe53c6ffa6f2989d6d837b87e1a8ea7938b5e8
children:
---

# commands/upload

## Purpose
Implements the upload command for encrypting and sharing workspace files with other bots via Blossom storage and Nostr NIP-17. Includes CLI adapter, command definition, handler, and core sync logic.

## Files
- `adapter.ts` - CLI adapter that parses upload arguments and converts handler results to message representations with appropriate tone.
- `definition.ts` - Subcommand definition with filePath and recipientNpub arguments, describes encrypt-and-upload via Blossom + NIP-17.
- `handler.ts` - Command handler that validates arguments, resolves workspace-relative paths, and returns success/usage/error results.
- `sync.ts` - Core sync logic: reads file, checks remote hash, encrypts with AES-GCM, uploads to Blossom, encrypts key with NIP-44, publishes Nostr event.

## Notes
- Uses NIP-44 for key encryption, AES-GCM for file encryption, and FILE_KIND events for metadata
- Skips upload if local file hash matches remote
- Builds naddr for referencing the uploaded file in Nostr

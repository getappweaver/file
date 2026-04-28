---
direct_hash: 99ffadc09495557e17d35bbd2f8145e6d5d5ae77b140b043c95e5d4318963270
subtree_hash: 69ad2deaab9cb5ff3b6cd8f3d1b1cc8dbe720c2a06119bebf42681f6b2b67800
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
  adapter.ts: 150640efeb750f6fb3b952d75bf5c8685b1e70ab6ff414f55d1516c7b2e1928c
  definition.ts: d05534507d88624373da6fb53b39d0d047c29ae62951f7529dcdad50f6a79a8c
  handler.ts: a6f15431cc8d317b76f90ba2663b587dc7028f653d5f6570cde28740c50ebf9f
  sync.ts: 0c7ae80bad212b06a25e45222abe53c6ffa6f2989d6d837b87e1a8ea7938b5e8
children:
---
# commands/upload

## Purpose
Implements the upload subcommand for immediately encrypting and sharing workspace files through Blossom storage and Nostr so they can be fetched later by the companion `download` flow. It is the file plugin’s outbound file-transfer path, exposing the capability through the standard command adapter/handler structure rather than the documentation-oriented `bottomup` tooling.

## Files
- `adapter.ts` - CLI adapter that parses upload arguments and converts handler results to message representations with appropriate tone.
- `definition.ts` - Subcommand definition with filePath and recipientNpub arguments, describing the encrypt-and-upload flow via Blossom and Nostr.
- `handler.ts` - Command handler that validates arguments, resolves workspace-relative paths, and returns success/usage/error results.
- `sync.ts` - Core upload logic: reads the workspace file, checks remote hash state, encrypts with AES-GCM, uploads to Blossom, encrypts the file key with NIP-44, publishes the Nostr metadata event, and returns an addressable reference.

## Notes
- This command is part of the file plugin’s immediate-execution transfer features, unlike the plugin’s draft-backed patterns elsewhere in the repo.
- Uses NIP-44 for key encryption, AES-GCM for file encryption, and file-share metadata events that can later be resolved by `commands/download`.
- Skips upload when the local file hash matches the remote version, avoiding unnecessary re-uploads.
- Builds an `naddr` reference for the uploaded file so it can be shared and downloaded later.
- Operates on workspace-relative paths, fitting the plugin’s workspace-bounded file access model.

## Subdirectories

---
direct_hash: e7c346e9ab0953e4fa39d76d24bd5da0e67ef6d2dbcf94240cd659db86d90628
subtree_hash: 5a3e34d393814d4537c8637569d97655d016cf50ccd0de576c34d1542d06e05a
files:
  adapter.ts: 55d720150f0ae006c0ad5d107eccc440f8ae4eea9e96b558ee24a9c38dc70da6
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

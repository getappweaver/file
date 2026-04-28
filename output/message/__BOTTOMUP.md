---
direct_hash: 0dfeaa95edee5a3dcef9df6d7165a37a583361aedb742bc1d1875223d8fa72ee
subtree_hash: 83106fc0c75b3a94bcbf2bfea53d7e4370c1f7c6e54b9a227f37a57b911c981a
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
  builder.ts: ed2e62f2de11aaf27c22ec3cebe73c02419c8c52af53c43d573522b43db7634b
  schema.ts: 42389ca8cd180e3d6b98dbb04d5db02b6149e1fe0ebea103dc9ddc386b825891
children:
  renderers: 2836153cf9920457742ee0adbb16fc73e268fed61000a9ffc3b07191daef8e45
---
# output/message

## Purpose
Message output layer for file-plugin command responses. It provides the generic structured representation used by most non-specialized subcommands before the top-level text renderer dispatches output, with tone (info/success/error), command metadata, and text content. The `renderers/` subdirectory handles simple CLI text output.

## Files
- `builder.ts` - Creates `MessageRepresentation` objects from command, subcommand, tone, and text params.
- `schema.ts` - Zod schemas for message data (tone, text) and the full representation using `createRepresentationSchema`.

## Notes
- Part of the plugin’s shared output system for command responses.
- Messages use representation kind `message` with version `1`.
- Tone controls the semantic feedback style for adapters that return plain informational, success, or error text instead of specialized web/tree/view/diff output.
- This layer is the common path for immediate text responses across the file plugin, while dedicated web renderers are used only for richer command-specific views.

## Subdirectories
- `renderers/` - Simple CLI text renderer returning raw message text without formatting.

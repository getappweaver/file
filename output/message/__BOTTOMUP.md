---
direct_hash: 0dfeaa95edee5a3dcef9df6d7165a37a583361aedb742bc1d1875223d8fa72ee
subtree_hash: 83106fc0c75b3a94bcbf2bfea53d7e4370c1f7c6e54b9a227f37a57b911c981a
files:
  builder.ts: ed2e62f2de11aaf27c22ec3cebe73c02419c8c52af53c43d573522b43db7634b
  schema.ts: 42389ca8cd180e3d6b98dbb04d5db02b6149e1fe0ebea103dc9ddc386b825891
children:
  renderers: 2836153cf9920457742ee0adbb16fc73e268fed61000a9ffc3b07191daef8e45
---

# output/message

## Purpose
Message output layer for CLI commands. Provides builder function and Zod schema for structured messages with tone (info/success/error), command metadata, and text content. Renderers subdirectory handles simple text output.

## Files
- `builder.ts` - Creates MessageRepresentation objects from command, subcommand, tone and text params
- `schema.ts` - Zod schemas for message data (tone, text) and full representation using createRepresentationSchema

## Notes
- Part of output system for command responses
- Messages use kind 'message' with version 1
- Tone enum controls visual feedback style

## Subdirectories
- `renderers/` - Simple CLI text renderer returning raw message text without formatting

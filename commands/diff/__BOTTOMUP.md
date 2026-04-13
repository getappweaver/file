---
direct_hash: 63f3b2da0ba3449f66f7b7316ca6f26c6a5430a09fc051d5125cbe454ceedf4d
subtree_hash: 891a3e58da04e117898779619f8b1e2947a6ea2b5039e3879a6408fb7f211929
files:
  adapter.ts: a705959212aef7cf70d181b39b4031808cf2757e0722768e8dc8730cd3af26fc
  definition.ts: bbafa90cd8e544f50a70acfa496b4732ece9ffe76bf80f288dd41a39cf5aea33
  handler.ts: f12d0d91ab70e20763a3da5af74a22ca9792e704d7ba85215fdcd2f3c4cf75a0
children:
  renderers: 06a6c5f20a1bd75c3df628c415d97d02f15095482c4d37bb33624dd650c4f3ea
---

# commands/diff

## Purpose
Implements the diff subcommand plugin for git diff previews. Provides CLI adapter, command definition, and core handler for generating color-formatted diff output. Handles both tracked and untracked files.

## Files
- `adapter.ts` - CLI entrypoint - parses path argument, resolves workspace, calls handler, returns message representation
- `definition.ts` - Subcommand metadata - defines arguments, options, and usage examples for the diff command
- `handler.ts` - Core diff logic - resolves file paths, invokes git, parses and truncates diff output for preview

## Notes
- Uses git status and git diff to generate diff output
- Supports truncation for large files and binary detection
- WebUI renderers available in subdirectory

## Subdirectories
- `renderers/` - WebUI renderers for diff output with color-coded lines (additions, deletions, context)

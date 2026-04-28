---
direct_hash: 43359ffb39c473e4456c882983e524b19d1373be25fd989a5df87b707273e8d3
subtree_hash: 0f433f07b16704cbb8c179f7cc3eba5b45208555f8b3c0af4fd85ae3426ab4b5
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
  adapter.ts: 1ca1db4d0c93de9ed5ab0002933803504c22a79f31c1b15164cb90ae9272f8e6
  definition.ts: 1b673ccf9b2859b8393878898b45d15da416097a604b5cc89805b13ebe2932d4
  handler.ts: eeb8818b2c0dda27fa9f841ff40aa7630398f0576b5d462d885d54915672fa85
children:
---
# commands/topdown

## Purpose
This directory exposes the `topdown` subcommand as the standalone second-pass refinement step in the file plugin’s documentation pipeline. It wires the CLI definition through argument adaptation into the execution path that enriches existing bottom-up docs using cached subtree summary context, so broader big-picture context can be added after `bottomup` has already produced the initial `__BOTTOMUP.md` files.

## Files
- `adapter.ts` - CLI adapter that converts parsed `topdown` arguments/options into a typed tool call, executes it against the resolved workspace root, and returns success or error message output.
- `definition.ts` - Subcommand definition for `topdown`, declaring its purpose, argument and option surface, and example invocations for the CLI.
- `handler.ts` - Execution entrypoint that validates summary and bottom-up doc prerequisites, builds filtering and scope context, and runs the refinement pass over existing directory docs.

## Notes
- `topdown` depends on existing `__BOTTOMUP.md` and `__BOTTOMUP_SUMMARY.md` data.
- It is the standalone form of the same big-picture enrichment workflow that `bottomup --two-pass` can trigger automatically.
- The handler reuses bottomup filesystem, option, cache, and tree logic rather than defining its own traversal.
- Like the rest of the file plugin, it executes immediately and surfaces failures as user-facing command messages in the adapter.

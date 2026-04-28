---
direct_hash: e1e7d7a417ca1640a46edbd7c98f86c6f5d25a2f12d8e1bfbaa4cc0cb8da17e4
subtree_hash: 7c84390d1c2494223a47eb18e50b600c224e4417ba2c6e708c9481acc1623377
files:
  adapter.ts: 379d28d61a86c8221f71344851347b64aaee3d453c714429953c1fdabb8d7d50
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

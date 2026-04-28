---
direct_hash: 66c534469dac0132514470953fc63c38ec6d58379a1c9dbf464895f931072324
subtree_hash: faae2d5f274c393f72ae6692aabedd4e68354b909601112a33bb75e45dd5725e
files:
  adapter.ts: 3a74bcccdc1ea742d409defef8b7f4cfb6e74936a06fbb5bb5e335c0c9cb532b
  definition.ts: 23efc00ddf161c4a4e12515aadf752c14a84e5d557aa213ed2a08b84715faea7
  handler.ts: 9db34d48bde00460df6ddc909244fad8efee54e89cd7b01a94c5a949288352c0
children:
---

# commands/summarize

## Purpose
Implements the `summarize` CLI command that reads generated bottom-up documentation and returns it as a flat subtree summary. It is the aggregation step in the file plugin’s documentation pipeline: higher-level review and second-pass refinement use this command to turn many per-directory `__BOTTOMUP.md` files into one linear context block, while also warning about missing or stale docs.

## Files
- `adapter.ts` - CLI entrypoint: parses arguments/options, invokes the summarize handler, and returns the result as a formatted message representation.
- `definition.ts` - Defines the subcommand schema: `workingDir` argument plus scope/depth/filtering options for choosing which bottom-up docs to include in the summary.
- `handler.ts` - Core logic: walks the target subtree, collects `__BOTTOMUP.md` files, validates their hashes for staleness warnings, and returns the joined summary text.

## Notes
- Depends on `../bottomup/handlers` for shared filtering and hash-validation logic.
- Aggregates existing `__BOTTOMUP.md` files; it does not generate documentation itself.
- Returns concatenated bottom-up doc contents as plain text, with warnings when source docs are missing or stale.
- No AI model invocation in this command; despite sharing option patterns with the broader documentation workflow, it is a read-only file aggregation step.

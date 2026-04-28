---
direct_hash: eb5ef3ec18279787f71c88de6ac2d66b7ec05a53a6e2c86219785163821826d8
subtree_hash: 6aa8814f93c43023a8543a45254ae7405943bfc236937514eb034a593393be5b
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
  adapter.ts: ea356aea3352e8453486a2b82e82f04bb4fb1cf4f6cb703cea0f07421fa84cbe
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

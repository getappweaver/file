---
direct_hash: 383fac6bbe217f611b1b96173a6a388ed2674cd6dfd9a2cd024955c98727c53d
subtree_hash: fd1f502acc61e84a575966f82a043610de2095536311913226df624866434eaa
files:
  adapter.ts: 343e0a1ecc951e2161cc98afbfd14fa99234150df773eca3422ca2b9eec56a10
  definition.ts: 47b080d086ab5adb54ec5eb48278db0a7651878381ed1977ddb2adea4b4b6c66
  handler.ts: c8698d11457327b551a7e2c623638d9394a1c54995eb9732eebb7c204c6ba47e
children:
  handlers: ebf26abdc0b57c676ba1548436cbad19d2fdc28236277442310229a5dabb9f9b
---

# commands/bottomup

## Purpose
Implements the `bottomup` subcommand that generates `__BOTTOMUP.md` files for directory subtrees in a depth-first pass. This is the primary documentation-generation command within the file plugin: it creates the per-directory bottom-up docs that later power `bottomup_context` and `summarize`, and it can also trigger the same big-picture enrichment workflow that the standalone `topdown` command exposes as a separate second pass.

## Files
- `adapter.ts` - CLI adapter - parses CLI invocation, calls executeBottomupTool, and returns the command result as a formatted message representation
- `definition.ts` - Command definition - declares arguments, options, and examples for the bottomup subcommand
- `handler.ts` - Core handler - walks the directory tree, builds directory nodes, renders `__BOTTOMUP.md`, and optionally runs a second refinement pass using summarized subtree context

## Notes
- Entrypoint is `adaptBottomupCommand` in `adapter.ts`
- Supports `--two-pass` to first generate bottom-up per-directory docs, then refine them with broader subtree context gathered through the summarize flow
- Writes one `__BOTTOMUP.md` per directory in the target subtree
- Serves as the producer for the plugin’s documentation pipeline: `bottomup_context` reads these docs for context, `summarize` aggregates them for flat subtree summaries, and the separate `topdown` command can later rerun the same enrichment logic against existing bottom-up artifacts
- The refinement flow depends on summary/cache data managed by the handlers layer, so this command is both the initial doc writer and the first stage in the plugin’s larger bottom-up → summarize → enrich workflow
- Like the rest of the file plugin’s command surface, it operates immediately within the resolved workspace rather than using the repo’s draft/review pattern

## Subdirectories
- `handlers/` - Implements the bottom-up documentation engine for directory trees, including AI summarization, doc parsing/rendering, filesystem operations, option normalization, and recursive tree building with hash-based change detection.

---
direct_hash: 0e826247d03f872b94e81e4fe60ddfe53b8e0369af39fa53d892c5e06551d8eb
subtree_hash: c3058dcbf4671a932195d5445eb0a066f15153c52c0a90b3dccd34149b09a787
files:
  adapter.ts: 97a0f44b06f198fd50b26344c45a2a6becc7b3cbcd5087c95de867deb36a5a7c
  definition.ts: 6510953d01271da7e138a40261942aea107653b509e3e5156333429b94266b01
  handler.ts: b0ab5a28cf7c22169d3bf96008d4db53506c1828f509aab4eb1ae7740bd77453
children:
  handlers: 7f9e3166fcc51deb0f2179a4c55f63b50662bd2a0bec5dc35324a4d5939fa130
---
# commands/bottomup

## Purpose
Implements the `bottomup` subcommand that generates `__BOTTOMUP.md` files for directory subtrees in a depth-first pass. This is the documentation-generation command within the file plugin: it produces the bottom-up docs that later power `bottomup_context` and `summarize`, and it optionally performs a second refinement pass to add big-picture context.

## Files
- `adapter.ts` - CLI adapter - parses CLI invocation, calls executeBottomupTool, and returns the command result as a formatted message representation
- `definition.ts` - Command definition - declares arguments, options, and examples for the bottomup subcommand
- `handler.ts` - Core handler - walks the directory tree, builds directory nodes, renders `__BOTTOMUP.md`, and optionally runs a second refinement pass using summarized subtree context

## Notes
- Entrypoint is `adaptBottomupCommand` in `adapter.ts`
- Supports `--two-pass` to first generate bottom-up per-directory docs, then refine them with broader subtree context gathered through the summarize flow
- Writes one `__BOTTOMUP.md` per directory in the target subtree
- Serves as the producer for the plugin’s documentation pipeline: `bottomup_context` reads these docs for context, and `summarize` aggregates them for flat subtree summaries

## Subdirectories
- `handlers/` - Implements the bottom-up documentation engine for directory trees, including AI summarization, doc parsing/rendering, filesystem operations, option normalization, and recursive tree building with hash-based change detection.

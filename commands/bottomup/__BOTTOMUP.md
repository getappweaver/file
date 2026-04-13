---
direct_hash: 185d79da717d1f4e9fb422b5182b36197c2ec1488a776094db30b539dd434716
subtree_hash: 9a76ff456efae4764acf6717fb3b6333fd8dc945ad1ec65883b27a2c83a1fadb
files:
  adapter.ts: 97a0f44b06f198fd50b26344c45a2a6becc7b3cbcd5087c95de867deb36a5a7c
  definition.ts: f755dcd888a3bb261e27676c4b0aa37a88faa6fedb1097e4f5f0ee90ab1d46e8
  handler.ts: 9281f294197762f51b88db44597f21ebc957a1c66b0ba304b516c0dcfd51711f
children:
  handlers: 21974d5aa9a1b4cf5795649c42ab1fc55903aeb3608efe427587286c16eeb86b
---

# commands/bottomup

## Purpose
Implements the `bottomup` subcommand that generates `__BOTTOMUP.md` files depth-first for folder subtrees. Uses AI to summarize each directory and supports an optional two-pass mode for enriched context.

## Files
- `adapter.ts` - CLI adapter - parses CLI invocation, calls executeBottomupTool, returns formatted message representation
- `definition.ts` - Command definition - declares arguments, options, and examples for the bottomup subcommand
- `handler.ts` - Core handler - walks directory tree, builds directory nodes, renders __BOTTOMUP.md, optional two-pass refinement with summarize tool

## Notes
- Entrypoint is adaptBottomupCommand in adapter.ts
- Supports --two-pass to refine summaries using big-picture context from summarize tool
- Writes one __BOTTOMUP.md per directory in the target subtree

## Subdirectories
- `handlers/` - Implements bottom-up AI-powered documentation generation for directory trees. Handles AI summarization, doc parsing/rendering, filesystem operations, option normalization, and recursive tree building with hash-based change detection.

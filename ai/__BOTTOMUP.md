---
direct_hash: fdbd35d27d88e97792719e54cced4bcc1018b022b775a06e34a4f9cd3a75c2b1
subtree_hash: d225db5c181197e2a1462fcfe468f065d8ba975424c4d89aef15d7027bedb23a
files:
  schema.ts: 01b9134cbab2d66e9087a004174138ad3c1b5ca44bdc13e6d1000658958475bb
  tooling.ts: 6b0e535b76a81f9472a9902cda184d66286cad14bcc3db9e210861f06f4d0548
children:
---
# ai

## Purpose
AI-facing tool layer for the dm-bot file plugin. Defines the schemas and execution handlers that let agents use the plugin’s documentation-oriented file tools, especially the bottom-up documentation workflow and its big-picture enrichment pass.

## Files
- `schema.ts` - Zod schemas for bottomup, bottomup_context, and summarize calls with nullable parameters; also exports the skill description and usage rules that guide agents toward stable, responsibility-focused documentation
- `tooling.ts` - Tool execution handlers that dispatch call types to their implementations and exports `agentInstructions` for using these tools from AI workflows

## Notes
- This directory is the AI bridge for the plugin’s documentation features: `bottomup_context` reads existing docs/context, `bottomup` generates `__BOTTOMUP.md` files, and `summarize` flattens subtree documentation for higher-level review or second-pass refinement
- The schemas intentionally allow explicit nullable inputs so callers can pass all fields while still deferring behavior to option normalization in the command handlers
- Guidance emphasizes scope-root–bounded traversal and documenting stable responsibilities over transient implementation details
- These tools execute immediately through the plugin CLI/tooling path and do not use the draft system

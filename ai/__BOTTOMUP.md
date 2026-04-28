---
direct_hash: ed710388ac63ea8bbefc3134773a3441dbf5dd27438a738a8787384a5c04a249
subtree_hash: 569deb369460b8a3365739fc522c95e4964afd7e21705bbd3191b433b3f8a75e
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
  schema.ts: 02399967f9428aa418db6e22341105db3d0d7a23da37189d1db408c17720cdb1
  tooling.ts: d32c219a3e79084fe71e9d755cd845582292b81508a076967184e83bd3c842d8
children:
---
# ai

## Purpose
AI-facing tool layer for the dm-bot file plugin. Defines the schemas and execution handlers that expose the plugin’s documentation-oriented capabilities to agents, especially the bottom-up `__BOTTOMUP.md` workflow, context retrieval, and subtree summarization used for later big-picture refinement.

## Files
- `schema.ts` - Zod schemas for bottomup, bottomup_context, and summarize calls with nullable parameters; also exports the skill description and usage rules that guide agents toward stable, responsibility-focused documentation
- `tooling.ts` - Tool execution handlers that dispatch call types to their implementations and exports `agentInstructions` for using these tools from AI workflows

## Notes
- This directory is the AI bridge for the plugin’s documentation pipeline rather than its general file-browsing commands: `bottomup_context` reads nearby `__BOTTOMUP.md` docs, `bottomup` generates them, and `summarize` flattens subtree docs so higher-level passes can review or refine them
- The schemas intentionally allow explicit nullable inputs so callers can pass all fields while still deferring behavior to option normalization in the bottomup handlers and command layer
- Guidance emphasizes scope-root–bounded traversal and documenting stable responsibilities over transient implementation details, which supports both initial bottom-up generation and later big-picture enrichment passes
- These tools execute immediately through the plugin CLI/tooling path and do not use the draft system

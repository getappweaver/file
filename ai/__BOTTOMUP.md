---
direct_hash: 023ff41104defcbfe22475b6618d310e939fa9cc05c6bdce022d0714c0bfb4c4
subtree_hash: 47b6e1cf66b6792460b7f64a123f1466409c889283565b2034e2a363f70ca0b1
files:
  schema.ts: 24a88da4b3a20d84ebe32e2e767c523a6946b025b3f9b9611e3b557bade55039
  tooling.ts: f0d3e09bc1289995df8561beb15269ac3324a50334cdf3f915c1275b4e0977a8
children:
---

# ai

## Purpose
Zod schemas and execution tooling for AI file tools (bottomup, bottomup_context, summarize) that generate and read local __BOTTOMUP.md documentation.

## Files
- `schema.ts` - Zod schemas for bottomup, bottomup_context, and summarize tool calls with options for depth, ignore, scope_root, and model selection
- `tooling.ts` - Executes file tool calls and provides agent instructions for using bottom-up doc generation

## Notes
- Implements the file plugin tools defined in schema.ts
- Uses resolveFileWorkspaceRoot to find the documentation scope root
- Tools run immediately without drafts

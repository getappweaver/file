---
direct_hash: f3f6dc0af17f34fd7c55917912ec3139e90097bb4d37c5ef17fcafa2142a60b5
subtree_hash: c058b980815da1587afa7e1c9dc5bd66ec441d3f765c00600235952325f7ee94
files:
  adapter.ts: 99497f1ce540cdb7306f613e2298e58534719d8bf361123b3327c10b2984ec35
  definition.ts: 0f06e0a2d6c2b3adcca95d487bbbc7c7cff7827526968c555cc0f9d874826195
  handler.ts: 9522a0f0bc97709df60fd80e441ccea126255ef79034746cb341eb45dfffbeae
children:
---

# commands/summarize

## Purpose
Implements the 'summarize' CLI command that reads .md bottomup documentation files and returns them as a flat text summary. Warns about missing or stale .md files.

## Files
- `adapter.ts` - CLI entrypoint: parses arguments/options and delegates to handler, returning formatted message representation.
- `definition.ts` - Defines command schema: workingDir argument, scope-root/depth/model/ignore/include-hidden/no-gitignore options.
- `handler.ts` - Core logic: recurses directories to collect .md files, validates hashes for staleness warnings, returns joined content.

## Notes
- Depends on ../bottomup/handlers for file filtering and hash computation
- Returns concatenated .md file contents joined by newlines
- No AI model invocation - purely a file aggregation tool

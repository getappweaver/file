---
direct_hash: 5b68233088ea529723480e8fa7f78d624ae6962fa35bb7544e5052f0814c92d8
subtree_hash: 2b5d1be9b4516012dbae2ab5999ea6ee28caedb12f96c291ad17d8245d0090c7
files:
  adapter.ts: 2c913f6efe8292a95a97c6cf049c68716482905ccfb704aba1d542b72da93c9c
  definition.ts: 0f06e0a2d6c2b3adcca95d487bbbc7c7cff7827526968c555cc0f9d874826195
  handler.ts: 27bd586664e6b00f2744ccc890a87f749ae6272fcf5d151f968bc584dcae65ab
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

---
direct_hash: d5bb72340696a81315b8067a69408ecb31d4350dd29b9454f6f5d109424f8a1f
subtree_hash: 1900e0ea88f85eb2cb835d0628fd050cdf645b876cc8bcb4feb997e499fda3d7
files:
  ai.ts: 2038ff95d47343bc0fc27dfa962975cabdfae1e6b7830fc66d47bf18716bf79c
  doc.ts: dead620bcf82de5ca647fe070fdb50c161665776f67943dfa1f9138049d5c480
  fs.ts: b10679470139cfae1b274e0a894fcb35e726c021292c49224f1684286babce78
  options.ts: 4ed6f981b92c793e0e2c81f0452a7fecbef5eccaa2468a35f96403be3ba8ba8b
  tree.ts: d9c51a73218020a4572fc23ca2bf8089b7912172ee984f476b3211999cddc047
  types.ts: 3ea217c67847e6382a444c9f8e457ef2ff5180ab0a4f33493276e2287a83afa6
children:
---

# commands/bottomup/handlers

## Purpose
Handlers for the bottomup documentation generator. Coordinates AI summarization, file system operations, tree building, and doc parsing/rendering.

## Files
- `ai.ts` - Prompts AI backend to generate directory summaries in JSON format, extracts JSON from model output.
- `doc.ts` - Parses and renders __BOTTOMUP.md files with YAML frontmatter and markdown body.
- `fs.ts` - File system utilities: ignore filtering (git/hidden), snippet reading, hashing, directory listing.
- `options.ts` - Normalizes CLI call options into resolved options with defaults.
- `tree.ts` - Builds directory tree recursively, coordinates AI summarization, skips unchanged dirs based on hash comparison.
- `types.ts` - TypeScript type definitions for DirectoryNode, BottomupResolvedOptions, and related structures.

## Notes
- Uses SHA256 hashing to skip unchanged directories
- Supports scope_root marker for limiting generation boundaries
- Outputs __BOTTOMUP.md files with YAML frontmatter

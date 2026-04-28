---
direct_hash: 9fff9242d429aff5a4f9e4bf727c86151f762a0dc5af738731f842e93ee8e769
subtree_hash: 7f9e3166fcc51deb0f2179a4c55f63b50662bd2a0bec5dc35324a4d5939fa130
files:
  ai.ts: 35327fc706a4e7964f7c5803716a3d386fad8aecbb78f78ced1e58eb9f302d30
  doc.ts: dead620bcf82de5ca647fe070fdb50c161665776f67943dfa1f9138049d5c480
  fs.ts: 110514a927e58750c0d2750766308ba6e2c3b7ffc2a26c85029c689dbdfca41d
  options.ts: 37c8946ebbef2b7f3e0f094d2055610de38564d2aacaeba1db04ca06802f085b
  tree.ts: 24b0d0b90a972a40dbd851bdccf27daf8bd030b8d7aa60d06b5485b47e968b9e
  types.ts: ba2e0c56fc4636f8b12ac58f5826936da5667a9a971ad3a576d0bb21a7c54749
children:
---
# commands/bottomup/handlers

## Purpose
Implements the shared engine for the file plugin’s AI-powered documentation workflows. It generates and updates `__BOTTOMUP.md` files for directory trees, supports the optional two-pass enrichment flow, and provides the parsing, filesystem, option normalization, and recursive tree logic reused by `bottomup` and related documentation commands.

## Files
- `ai.ts` - AI backend integration: runs prompts via createBackend, handles JSON extraction, implements summarizeDirectoryWithAi (pass1), refineDirectoryWithAi (pass2), and summarizeTreeForUser.
- `doc.ts` - Markdown doc parsing/rendering: parseExistingBottomupDoc, renderBottomupMarkdown, writeBottomupDocs, flattenNodes, serializeNodeForSummary, normalizeOneLine.
- `fs.ts` - Filesystem utilities: resolveWorkingDirectory, detectScopeRoot, IgnoreFilter class (gitignore + hidden files), listDirectoryEntries, readFileSnippet, sha256Hex/hashObject, listChildBottomupStatus.
- `options.ts` - Option normalization: transforms BottomupCall, SummarizeCall, BottomupContextCall into resolved options with defaults (respectGitignore, excludeHidden, depth, model, twoPass).
- `tree.ts` - Recursive tree operations: buildDirectoryNode (with hash-based skip logic), refineDirectoryNodePass2 (top-down refinement), writes __BOTTOMUP.md to each directory.
- `types.ts` - Shared types: BOTTOMUP_FILE constant, BottomupResolvedOptions, DirectoryNode, FileSnippet, DirectoryEntry, AI_DIRECTORY_SUMMARY_SCHEMA.

## Notes
- Serves as the core implementation behind the plugin’s documentation-oriented tools, not just the `bottomup` CLI adapter
- Uses SHA-256 content hashing to skip unchanged directories and detect stale generated docs
- Two-pass mode first builds local bottom-up summaries, then refines them with broader subtree context
- `options.ts` centralizes normalization for `bottomup`, `summarize`, and `bottomup_context`, keeping those commands aligned
- Integrates with external AI backends via `@src/backends`

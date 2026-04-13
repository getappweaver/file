---
direct_hash: 5707703d3c4d5f506110d8ad769d7c248a194f55770fff7fb05b044f66344fc9
subtree_hash: 21974d5aa9a1b4cf5795649c42ab1fc55903aeb3608efe427587286c16eeb86b
files:
  ai.ts: 6c585f61f410f4830fae19ac368ca569c8f175e16efdee6ed0f5cbe7c292a2b6
  doc.ts: dead620bcf82de5ca647fe070fdb50c161665776f67943dfa1f9138049d5c480
  fs.ts: b10679470139cfae1b274e0a894fcb35e726c021292c49224f1684286babce78
  options.ts: 37c8946ebbef2b7f3e0f094d2055610de38564d2aacaeba1db04ca06802f085b
  tree.ts: 6a4db31a46222fa9747f232de1066acdb0e75e564158f458625d39a4b680abc7
  types.ts: ba2e0c56fc4636f8b12ac58f5826936da5667a9a971ad3a576d0bb21a7c54749
children:
---

# commands/bottomup/handlers

## Purpose
Implements bottom-up AI-powered documentation generation for directory trees. Handles AI summarization, doc parsing/rendering, filesystem operations, option normalization, and recursive tree building with hash-based change detection.

## Files
- `ai.ts` - AI backend integration: runs prompts via createBackend, handles JSON extraction, implements summarizeDirectoryWithAi (pass1), refineDirectoryWithAi (pass2), and summarizeTreeForUser.
- `doc.ts` - Markdown doc parsing/rendering: parseExistingBottomupDoc, renderBottomupMarkdown, writeBottomupDocs, flattenNodes, serializeNodeForSummary, normalizeOneLine.
- `fs.ts` - Filesystem utilities: resolveWorkingDirectory, detectScopeRoot, IgnoreFilter class (gitignore + hidden files), listDirectoryEntries, readFileSnippet, sha256Hex/hashObject, listChildBottomupStatus.
- `options.ts` - Option normalization: transforms BottomupCall, SummarizeCall, BottomupContextCall into resolved options with defaults (respectGitignore, excludeHidden, depth, model, twoPass).
- `tree.ts` - Recursive tree operations: buildDirectoryNode (with hash-based skip logic), refineDirectoryNodePass2 (top-down refinement), writes __BOTTOMUP.md to each directory.
- `types.ts` - Shared types: BOTTOMUP_FILE constant, BottomupResolvedOptions, DirectoryNode, FileSnippet, DirectoryEntry, AI_DIRECTORY_SUMMARY_SCHEMA.

## Notes
- Uses SHA-256 content hashing to skip unchanged directories
- Two-pass mode: first generates bottom-up summaries, then refines with big-picture context
- Integrates with external AI backends via @src/backends

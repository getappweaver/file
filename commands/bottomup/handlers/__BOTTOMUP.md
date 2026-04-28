---
direct_hash: 6b3633a8658dadefa69e4976d50b24fbeb47920ed4ac7aa0c92746e1dfafaef5
subtree_hash: ebf26abdc0b57c676ba1548436cbad19d2fdc28236277442310229a5dabb9f9b
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
  ai.ts: 35327fc706a4e7964f7c5803716a3d386fad8aecbb78f78ced1e58eb9f302d30
  doc.ts: d52efbeb0a3006d8e61cbcb6a887140fe2e9bc5f55a4e43a6c4972668129a13b
  fs.ts: bf305e2d3799421beeee285c8490a1e67708c8d2c723ff5bd998fa2576f62e5d
  options.ts: 8f4d6fde29cff8097d3f625a9ea3bd7b1ffe5dcce1ef7ecffbf21d0d4e75cd0f
  summary-cache.ts: 07a4b05bcc682fa337e2fc003ef856dab4b980b3e9e79aa46b0e0c343dd33050
  tree.ts: 78bb531ee7ad9ed5ae0d6db69920c28192ab08ebd070612c66ef86e9207cc09c
  types.ts: c0386cda6de4839a1c52fcde4330a63e4f0deb2798f91dad1479eb0b4f9303e3
children:
---

# commands/bottomup/handlers

## Purpose
This directory is the core implementation layer behind the file plugin’s documentation pipeline. It scans workspace-bounded directory trees, normalizes options shared across `bottomup`, `summarize`, `bottomup_context`, and `topdown`, generates or reuses per-directory documentation, and writes the markdown/cache artifacts that other commands later read or validate. It also owns the AI prompt/repair flow and the hash-based logic that decides when docs can be skipped, refreshed, or enriched in a second pass.

## Files
- `ai.ts` - Runs AI-backed directory summarization and second-pass refinement, including prompt construction, backend/session setup, JSON extraction or repair, and validation of returned summaries.
- `doc.ts` - Parses existing bottom-up docs, renders the canonical markdown format, writes docs for a tree, and produces compact run or tree-summary output.
- `fs.ts` - Provides filesystem and path utilities for bottom-up scanning, including scope-root resolution, ignore filtering, file snippet extraction, hashing, and child doc-status listing.
- `options.ts` - Normalizes schema-level bottomup, summarize, context, and topdown calls into internal option objects with local defaults.
- `summary-cache.ts` - Reads and writes the cached subtree summary file used to persist rendered summary bodies together with the hash and option context that produced them.
- `tree.ts` - Builds directory nodes recursively, decides whether to skip, reuse, or regenerate docs, writes updated markdown, and performs the top-down enrichment pass over existing bottom-up docs.
- `types.ts` - Defines the local constants, AI JSON schema shape, option types, and directory/file data structures shared across these handlers.

## Notes
- Docs are stored as `__BOTTOMUP.md` with frontmatter hashes and optional scope/enrichment markers, and subtree-level summary cache data is persisted separately for later refinement.
- Reuse is hash-driven: unchanged docs are skipped, partially reusable docs get hashes refreshed, and stale pass-2 docs are not refined.
- This directory’s helpers are shared beyond initial generation: `summarize` relies on the same filtering/hash logic for staleness checks, and `topdown` reuses the refinement path over existing bottom-up artifacts.
- Path handling and ignore behavior are workspace-bounded and can respect `.gitignore` plus extra ignore patterns.

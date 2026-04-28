---
direct_hash: f291da9fe9ef83853d36375887196e00238a9d7f016c245fc6543933d1668cad
subtree_hash: 27dc7388c008afd4eb926393e8e002801241b8fa804d6ca6af205c196555d8f0
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
  text.ts: 03c4b793dd8b9bbcafdf36d1537a3d210a6bbb8f2cecf41b4f2856df10dd45f4
children:
  shared: f3f4ffc4eed91c9a25887e5a560a5d5e856105b23c39b44db6dedf5a7ee787c5
---
# renderers

## Purpose
Unified text-rendering entrypoint for the file plugin’s shared command-output path. It dispatches representation kinds such as help and message to their CLI text renderers, complementing the plugin’s separate WebNode-based renderers used by interactive tree/view/diff flows.

## Files
- `text.ts` - Dispatcher routing shared representation kinds like `help` and `message` to their respective text renderers for CLI/plain-text output.

## Notes
- This directory handles only the plugin’s generic text output path, not the specialized web renderers used by commands such as `tree`, `view`, and `diff`.
- It sits above the concrete help/message renderers and keeps command adapters decoupled from representation-specific text formatting.

## Subdirectories
- `shared/` - Empty directory.

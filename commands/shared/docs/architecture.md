# Shared File command helpers

Shared helpers keep command adapters thin while enforcing common containment,
filtering, transfer, and navigation behavior.

- `ignore-filter.ts` — Ignore policy, hidden-file handling, extra globs, and cached
  Git ignore/tracked-file checks used by file discovery.
- `nostr-file.ts` — Blossom authentication, upload/download, encrypted payload
  transfer, and Nostr file-address construction.
- `web-breadcrumb.ts` — Workspace file-path breadcrumbs, per-segment tree actions,
  timeline-opening helpers, and shared styles.
- `workspace-root.ts` — Active workspace resolution and path/repository containment
  checks before filesystem, Git, or transfer operations.

Diff/preview behavior is implemented by the retained file-edit and Git modules.

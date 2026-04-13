---
direct_hash: 9dcb5eefc21a929e3b2818368ca3f0c78deb7d087280b74b844fc71ca70f9c07
subtree_hash: e89b708c5b92dfa47ba50ce8f2399fcd0604a7d6dc6ae25fddbfe10bd34e67ae
files:
  cli-option-parsing.ts: 3f01d5b5bf27c5f641d293874efabaa4dace119f55396126da9aab064f5cb8b4
  nostr-file.ts: 78c55109ab4c4aa4921233dcf5c393eef3ce61f1eb8af03260bcc4bbace44960
  workspace-root.ts: 447198715ec18a493243c12a92142d9ec4eb5ed540723e882c1999b638c69160
children:
---

# commands/shared

## Purpose
Shared utilities for dm-bot CLI commands. Provides CLI option parsing coercions and Nostr Blossom file storage functions.

## Files
- `cli-option-parsing.ts` - CLI option parsing — string, int, bool, and CSV array coercions
- `nostr-file.ts` - Blossom file operations — upload, download, naddr encoding for kind 34343
- `workspace-root.ts` - Resolves workspace root from core DB and dm-bot paths

## Notes
- Exports parsing helpers for command arguments
- Integrates with nostr-tools for Blossom uploads

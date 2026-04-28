---
direct_hash: 9dcb5eefc21a929e3b2818368ca3f0c78deb7d087280b74b844fc71ca70f9c07
subtree_hash: e89b708c5b92dfa47ba50ce8f2399fcd0604a7d6dc6ae25fddbfe10bd34e67ae
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
  cli-option-parsing.ts: 3f01d5b5bf27c5f641d293874efabaa4dace119f55396126da9aab064f5cb8b4
  nostr-file.ts: 78c55109ab4c4aa4921233dcf5c393eef3ce61f1eb8af03260bcc4bbace44960
  workspace-root.ts: 447198715ec18a493243c12a92142d9ec4eb5ed540723e882c1999b638c69160
children:
---
# commands/shared

## Purpose
Shared utilities for file-plugin subcommands. This directory centralizes common CLI coercion, workspace-root resolution, and Nostr/Blossom file-transfer helpers so command adapters across the plugin can share the same workspace-bounded behavior, whether they are invoked from the standalone CLI or through dm-bot.

## Files
- `cli-option-parsing.ts` - CLI option coercion helpers for string, int, bool, and CSV-array values used across command adapters
- `nostr-file.ts` - Shared Nostr/Blossom file-transfer helpers, including upload/download support and naddr encoding used by the plugin’s file-sharing flows
- `workspace-root.ts` - Resolves the effective workspace root from dm-bot/core context so CLI and bot-invoked commands operate on the correct target workspace

## Notes
- Provides the common parsing layer used by multiple file-plugin subcommands instead of duplicating option handling per command.
- `workspace-root.ts` is part of the bridge between standalone CLI usage and dm-bot-managed workspace selection/state, helping keep all file operations scoped to the intended workspace root.
- Nostr/Blossom helpers are the shared foundation beneath the plugin’s immediate-execution upload/download flows and integrate with `nostr-tools`.
- This directory is infrastructure for the command layer rather than a user-facing surface: it supplies the reusable glue that lets different subcommands share consistent path resolution, option handling, and file-transfer behavior.

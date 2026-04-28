---
direct_hash: 4130f4e92912bbbce51e1cb4eabe2e12b2279f74bc04f10695e7410ab583f56e
subtree_hash: 1bea535d9da902dcc4099a7025fa45d079a4f633df771c8c712865086ae195ad
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
  stylesheet.ts: b279138521af1ad778fb4bd67ea4db176034d7c25d40251bc65193f09323e4f0
  web.ts: 1f39010cf699d74cf4eab21ed75fb4a87572c59b66e5ff413a6d590fa6e291d1
children:
---
# commands/view/renderers

## Purpose
Web renderers for the file view command. Contains the scoped styling and WebNodeRoot renderer that turns workspace file-view results into the generic web UI used by the file plugin’s tree/view/diff browsing flow.

## Files
- `stylesheet.ts` - Scoped styles for web file viewing, including code/content display in the generic Web UI renderer
- `web.ts` - Main renderer converting FileViewOk/FileViewErr results into WebNodeRoot output with language detection and navigation actions

## Notes
- Provides language detection mapping from file extension to hljs language
- Handles both binary and text file display with truncation warnings
- Uses parentTreeAction to navigate back to the containing folder, fitting into the broader tree/view/diff web navigation flow
- Follows the repo’s plugin-agnostic web rendering model by producing generic WebNodeRoot output rather than frontend-specific behavior

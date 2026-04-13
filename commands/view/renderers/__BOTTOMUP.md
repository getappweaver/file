---
direct_hash: 4130f4e92912bbbce51e1cb4eabe2e12b2279f74bc04f10695e7410ab583f56e
subtree_hash: 1bea535d9da902dcc4099a7025fa45d079a4f633df771c8c712865086ae195ad
files:
  stylesheet.ts: b279138521af1ad778fb4bd67ea4db176034d7c25d40251bc65193f09323e4f0
  web.ts: 1f39010cf699d74cf4eab21ed75fb4a87572c59b66e5ff413a6d590fa6e291d1
children:
---

# commands/view/renderers

## Purpose
Web renderers for the file view command. Contains UI schema styling and a renderer that converts file view results to WebNodeRoot for web display.

## Files
- `stylesheet.ts` - CSS styles for code block display in web view
- `web.ts` - Main renderer converting FileViewOk/FileViewErr to WebNodeRoot with language detection

## Notes
- Provides language detection mapping from file extension to hljs language
- Handles both binary and text file display with truncation warnings
- Uses parentTreeAction to navigate back to folder

---
direct_hash: 9ca0fe2568b480b20f790cf5328ca3ba0d0ffc67b6eae54f8814906371a2bf1b
subtree_hash: bec578bef9ded10cf9931fbe1e7740fced2e6142d40adef49f0faba614238300
files:
  stylesheet.ts: 441c16057edaebc147c23e67fb120be886552897c80615e990e53e62b8223638
  web.ts: da3d3d47bbb95546d7f9e42c75d582b999655d524750e146fa810962be6d5273
children:
---

# commands/tree/renderers

## Purpose
Web UI renderers for the file tree browser command. Provides a rich web-based file tree view with git status badges, navigation controls, and clickable file/directory links.

## Files
- `stylesheet.ts` - CSS stylesheet for file tree web UI (monospace fonts, layout, git status colors)
- `web.ts` - Web renderer producing tree browser UI with navigation, file listing, and git badges

## Notes
- Stylesheet defines monospace typography and color-coded git status indicators
- Web renderer builds WebNodeRoot UI with navigation links, directory listing, and diff actions

---
direct_hash: 735be575ba6d8a3e526682eea0b885fc7cc4163adcc7653e2125b386f8b0e802
subtree_hash: f8cfa5cbc0f7f5ca8856ccfebab995216ac6adf1c1b4406b3077b9ce37f1f38b
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
  stylesheet.ts: 776b87b57e440f15157655e8dd977867d3dc27b7a6347b2999d712dca8e5db1c
  tree.svg: 2bc1abf5f81f74b0836b7a0db8fe8cedd732b27cc0c2886cb5dfec57c950b7d0
  web.ts: 721784d96ae98e662cd3bb546cb5af1b76eb11467532cd70470562bffeff8751
children:
---
# commands/tree/renderers

## Purpose
This directory contains the web-facing renderer assets for the tree command. It turns workspace tree data into a generic `WebNodeRoot` browser view and supplies the scoped stylesheet and icon used for the file-plugin’s tree surface within the broader tree/view/diff navigation flow.

## Files
- `stylesheet.ts` - Defines the scoped stylesheet for the file-tree browser, including layout, link styling, navigation controls, and git-status color states.
- `tree.svg` - Provides the tree command’s icon asset for UI surfaces that need a visual marker.
- `web.ts` - Renders workspace tree results into generic Web UI nodes, wiring navigation, lazy folder expansion, file viewing, and diff actions into the tree browser.

## Notes
- Web output is built around command actions that connect the tree browser to the related `view` and `diff` command flows.
- Styling is scoped through a dedicated `WebStyleSheet`, matching the plugin’s renderer pattern and the repo’s generic web-renderer model.
- This folder is a self-contained renderer surface with no child directories.

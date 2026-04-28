---
direct_hash: e6f5ea222d509a6505b01e9e21d72fdfb46b2cbcdd17e326e2fc06f12c38d694
subtree_hash: a13ce5e043ef15a7c213779a6ff00ca6532ab78214967dc7dab733c12583ca32
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
  adapter.ts: 2c908917641574c1b3932d150c937e844fdbab420b126fabeb74e0f1bd876c3d
  module.ts: 4289984e5cfdec74b9c6495436f044a4203395f1c5c1a9b844bf3e4c9c0167a2
children:
---
# commands/help

## Purpose
Help command adapter and formatting utilities for the dm-bot file plugin’s CLI subcommands. This directory provides the user-facing usage/help surface for the plugin’s command set, turning command definitions into consistent help output for command-line and bot-driven flows across the plugin’s file-browsing, transfer, and documentation commands.

## Files
- `adapter.ts` - Adapts parsed CLI invocation into the plugin’s help message representation, so help output goes through the same shared response pipeline as other file commands
- `module.ts` - Formats subcommand usage strings from the file plugin’s command definitions and exports `getFileHelpLines` and `getFileCommandDefinition`

## Notes
- Small adapter/module pattern: the adapter delegates to shared help-line/definition builders
- Sits at the command-surface layer: it documents the file plugin’s available subcommands rather than implementing file operations itself
- Help output uses the plugin’s generic message/representation path, unlike the specialized WebNode renderers used by interactive commands such as `tree`, `view`, and `diff`
- Public exports: `adaptHelpCommand`, `getFileHelpLines`, `getFileCommandDefinition`

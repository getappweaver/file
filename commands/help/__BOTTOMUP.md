---
direct_hash: 13d894b4c215d6f91878549730e918dc17802d44c95d8e0483bed46b3a35b18d
subtree_hash: 8eb1ff78fe64c6675af88e07e633f77ba4c28ddccdf8dc09587576099cfabab4
files:
  adapter.ts: cd4eba3ab35ed1c4b81291525f6b5dd745b41afd1c7e82d79dcb2471366a786c
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

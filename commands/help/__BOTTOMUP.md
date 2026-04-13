---
direct_hash: e6f5ea222d509a6505b01e9e21d72fdfb46b2cbcdd17e326e2fc06f12c38d694
subtree_hash: a13ce5e043ef15a7c213779a6ff00ca6532ab78214967dc7dab733c12583ca32
files:
  adapter.ts: 2c908917641574c1b3932d150c937e844fdbab420b126fabeb74e0f1bd876c3d
  module.ts: 4289984e5cfdec74b9c6495436f044a4203395f1c5c1a9b844bf3e4c9c0167a2
children:
---

# commands/help

## Purpose
Help command adapter and formatting utilities for CLI subcommands.

## Files
- `adapter.ts` - Adapts parsed CLI invocation to help message representation via buildHelpSubcommandRepresentation
- `module.ts` - Formats subcommand usage strings with arguments/options; exports getFileHelpLines and getFileCommandDefinition

## Notes
- Single-file module pattern: adapter delegates to command builder
- Public exports: adaptHelpCommand, getFileHelpLines, getFileCommandDefinition

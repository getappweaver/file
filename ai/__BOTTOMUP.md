---
direct_hash: f96008dc22a7f1b6e1285ac130378ad65a4ffb6797ed91fce217324c168c312f
subtree_hash: 9ea44eb1c7a8779d24a68d8b40da9d797cb2418d4616593b3a185eac9de6387b
files:
  schema.ts: e10312606a512a54fa5e4deb378f18eb5f2ddaa481712fc5fc5a7abbbfc2746e
  tooling.ts: f0d3e09bc1289995df8561beb15269ac3324a50334cdf3f915c1275b4e0977a8
children:
---

# ai

## Purpose
AI agent file documentation plugin providing bottom-up documentation tools. Defines schemas for file tool calls and implements execution handlers.

## Files
- `schema.ts` - Zod schemas for bottomup, bottomup_context, summarize calls with nullable parameters; exports skill description and rules
- `tooling.ts` - Tool execution handlers mapping call types to implementations; exports agentInstructions with usage rules

## Notes
- Tools: bottomup_context reads existing docs, bottomup generates __BOTTOMUP.md files, summarize returns flat summaries
- Skill rules: scope_root controls parent traversal, prefer stable responsibilities over implementation details
- Executed via cli.ts alias; does not use drafts

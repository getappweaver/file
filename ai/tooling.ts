import { Database } from 'bun:sqlite';

import { executeBottomupTool } from '../commands/bottomup/handler';
import { executeBottomupContextTool } from '../commands/bottomup/handler';
import { resolveFileWorkspaceRoot } from '../commands/shared/workspace-root';
import { executeSummarizeTool } from '../commands/summarize/handler';
import { executeTopdownTool } from '../commands/topdown/handler';

import type { FileToolCall } from './schema';

export function agentInstructions(alias: string): string {
  return `## File (${alias} tools)

Use these tools to generate and read local bottom-up documentation for AI agents.

The goal is to compress stable structural knowledge about a subtree into small local documents so future agents need fewer exploratory reads and spend fewer tokens rebuilding context.

- \`bottomup_context\` reads the current folder context from existing \`__BOTTOMUP.md\` files without rewriting anything. Use this for targeted questions about a specific directory or file — it returns the doc for that directory plus its immediate parents and children.
- \`summarize\` returns the flat concatenated content of all existing \`__BOTTOMUP.md\` files in a subtree — use this for broad questions spanning multiple directories. Avoid using it for single-file or single-directory questions as it returns far more content than needed.
- \`bottomup\` traverses depth-first and writes \`__BOTTOMUP.md\` files for the requested subtree.
- \`topdown\` enriches existing \`__BOTTOMUP.md\` files using cached \`__BOTTOMUP_SUMMARY.md\` context.
- \`scope_root\` limits parent traversal for a subtree. If omitted, the tool looks upward for an existing \`__BOTTOMUP.md\` with \`scope_root: true\` and uses that as the logical root.

The generated \`__BOTTOMUP.md\` files contain:
- Directory purpose and responsibilities
- Per-file summaries describing what each file does and what it exports
- Implementation notes, architectural decisions, and local conventions
- Subdirectory summaries

**Use \`bottomup_context\` or \`summarize\` to answer questions about how a subtree is implemented before reading any source files.**

If you are unsure of the exact directory path, call \`bottomup_context\` on the nearest known parent with \`child_depth: 2\` to discover the correct subdirectory structure before drilling down.

Bottom-up documentation rules:
- Each \`__BOTTOMUP.md\` stays local to its own directory.
- Respect existing \`scope_root: true\` frontmatter when deciding how far upward to traverse.
- Summaries do not inline child directory content.
- Prefer stable responsibilities, public/exported entrypoints, important side effects, and local conventions over helper-by-helper narration.
- Agents should read the nearest \`__BOTTOMUP.md\` first, then inspect parents or children only when more context is needed.
- After editing files, ask the user whether to regenerate bottom-up docs for the affected directory and its ancestors.
`;
}

export async function executeTool(params: {
  alias: string;
  call: FileToolCall;
  db: Database;
}): Promise<string> {
  const workspaceRoot = resolveFileWorkspaceRoot();

  switch (params.call.type) {
    case 'bottomup':
      return executeBottomupTool({
        workspaceRoot,
        call: params.call,
        db: params.db,
      });
    case 'bottomup_context':
      return executeBottomupContextTool({
        workspaceRoot,
        call: params.call,
        db: params.db,
      });
    case 'summarize':
      return executeSummarizeTool({
        workspaceRoot,
        call: params.call,
        db: params.db,
      });
    case 'topdown':
      return executeTopdownTool({
        workspaceRoot,
        call: params.call,
        db: params.db,
      });
  }
}

export function openDb(): Database {
  return new Database(':memory:');
}

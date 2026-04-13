import { Database } from 'bun:sqlite';

import { executeBottomupTool } from '../commands/bottomup/handler';
import { executeBottomupContextTool } from '../commands/bottomup/handler';
import { executeSummarizeTool } from '../commands/summarize/handler';
import { resolveFileWorkspaceRoot } from '../commands/shared/workspace-root';

import type { FileToolCall } from './schema';

export function agentInstructions(alias: string): string {
  return `## File (${alias} tools)

Use these tools to generate and read local bottom-up documentation for AI agents.

The goal is to compress stable structural knowledge about a subtree into small local documents so future agents need fewer exploratory reads and spend fewer tokens rebuilding context.

- \`bottomup_context\` reads the current folder context from existing \`__BOTTOMUP.md\` files without rewriting anything.
- \`bottomup\` traverses depth-first and writes \`__BOTTOMUP.md\` files for the requested subtree.
- \`summarize\` returns a flat AI summary for a folder or subtree without writing files.
- \`scope_root\` limits parent traversal for a subtree. If omitted, the tool looks upward for an existing \`__BOTTOMUP.md\` with \`scope_root: true\` and uses that as the logical root.

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
  }
}

export function openDb(): Database {
  return new Database(':memory:');
}

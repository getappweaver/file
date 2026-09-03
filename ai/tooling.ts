import { Database } from 'bun:sqlite';

import {
  executeBottomupEnrich,
  formatEnrichResult,
} from '../commands/bottomup-enrich/handler';
import {
  executeBottomupGenerate,
  formatGenerateResult,
} from '../commands/bottomup-generate/handler';
import {
  executeBottomupSummarize,
  formatSummarizeResult,
} from '../commands/bottomup-summarize/handler';
import { executeBottomupSummary } from '../commands/bottomup-summary/handler';
import { resolveFileWorkspaceRoot } from '../commands/shared/workspace-root';

import type { FileToolCall } from './schema';

export function agentInstructions(alias: string): string {
  return `## File (${alias} tools)

Use these tools to generate and read local bottom-up documentation for AI agents.

The goal is to compress stable structural knowledge about a subtree into small local documents so future agents need fewer exploratory reads and spend fewer tokens rebuilding context.

- \`bottomup.generate\` creates source-grounded \`.BOTTOMUP.json\` knowledge for one directory. Use \`recursive: true\` only for explicit bulk initialization; use \`plan: true\` to inspect scope without AI calls or writes.
- \`bottomup.summarize\` recursively combines accepted source knowledge and immediate child summaries into compact hierarchical summaries. It does not read raw source or contextual enrichment.
- \`bottomup.summary\` reads current stored knowledge without AI calls. Use it before broad source exploration.
- \`bottomup.enrich\` recursively adds architectural role after summarization, using compact summaries plus explicit, saved, or summary-derived context. It does not send raw source by default.

- The generated \`.BOTTOMUP.json\` indexes contain:
- Directory purpose and responsibilities
- Per-file summaries describing what each file does and what it exports
- Compact hierarchical summaries
- Separate contextual enrichment

**Use \`bottomup.summary\` to answer questions about how a subtree is implemented before reading source files.**

If you are unsure of the exact directory path, call \`bottomup.summary\` on the nearest known parent with \`child_depth: 2\` to discover the indexed child structure before drilling down.

Bottom-up documentation rules:
- Each \`.BOTTOMUP.json\` stays local to its own directory.
- Respect marked JSON roots when deciding how far upward to traverse.
- Summaries do not inline child directory content.
- Prefer stable responsibilities, public/exported entrypoints, important side effects, and local conventions over helper-by-helper narration.
- Agents should read \`bottomup.summary\` first, then inspect source only when stored knowledge is missing, stale, or insufficient.
- After semantic edits, ask the user whether to refresh bottom-up knowledge for the affected directory and its ancestors.
`;
}

export async function executeTool(params: {
  alias: string;
  call: FileToolCall;
  db: Database;
}): Promise<string> {
  const workspaceRoot = resolveFileWorkspaceRoot();

  switch (params.call.type) {
    case 'bottomup.summary':
      return executeBottomupSummary({
        workspaceRoot,
        call: params.call,
      });
    case 'bottomup.summarize':
      return formatSummarizeResult(
        await executeBottomupSummarize({
          workspaceRoot,
          call: params.call,
        }),
      );
    case 'bottomup.enrich':
      return formatEnrichResult(
        await executeBottomupEnrich({
          workspaceRoot,
          call: params.call,
        }),
      );
    case 'bottomup.generate':
      return formatGenerateResult(
        await executeBottomupGenerate({
          workspaceRoot,
          call: params.call,
        }),
      );
  }
}

export function openDb(): Database {
  return new Database(':memory:');
}

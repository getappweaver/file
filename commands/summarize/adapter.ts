import type { FileCommandAdapterParams } from '../../types/adapter-params';

import {
  boolToOverride,
  csvToArrayOrNull,
  intOrNull,
  stringOrNull,
} from '../shared/cli-option-parsing';
import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import { executeSummarizeTool } from './handler';

export async function adaptSummarizeCommand(
  params: FileCommandAdapterParams,
): Promise<string> {
  void params.command;
  try {
    const result = await executeSummarizeTool({
      workspaceRoot: resolveFileWorkspaceRoot(),
      db: null as never,
      call: {
        type: 'summarize',
        working_dir: stringOrNull(params.parsed.arguments.workingDir),
        scope_root: stringOrNull(params.parsed.options.scopeRoot),
        depth: intOrNull(params.parsed.options.depth),
        respect_gitignore: boolToOverride(
          params.parsed.options.noGitignore,
          false,
        ),
        exclude_hidden: boolToOverride(
          params.parsed.options.includeHidden,
          false,
        ),
        extra_ignore: csvToArrayOrNull(params.parsed.options.ignore),
        include_file_summaries: true,
        model: stringOrNull(params.parsed.options.model),
        max_file_bytes: null,
        write_summary:
          params.parsed.options.writeSummary === true ? true : null,
      },
    });

    return result;
  } catch (err) {
    return String(err instanceof Error ? err.message : err);
  }
}

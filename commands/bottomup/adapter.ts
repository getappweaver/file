import type { FileCommandAdapterParams } from '../../types/adapter-params';

import {
  boolToOverride,
  csvToArrayOrNull,
  intOrNull,
  stringOrNull,
} from '../shared/cli-option-parsing';
import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import { executeBottomupTool } from './handler';

export async function adaptBottomupCommand(
  params: FileCommandAdapterParams,
): Promise<string> {
  void params.command;
  try {
    const result = await executeBottomupTool({
      workspaceRoot: resolveFileWorkspaceRoot(),
      db: null as never,
      call: {
        type: 'bottomup',
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
        two_pass: null,
      },
    });

    return result;
  } catch (err) {
    return String(err instanceof Error ? err.message : err);
  }
}

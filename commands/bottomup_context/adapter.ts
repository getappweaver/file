import type { FileCommandAdapterParams } from '../../types/adapter-params';

import { executeBottomupContextTool } from '../bottomup/handler';
import {
  boolToOverride,
  csvToArrayOrNull,
  intOrNull,
  stringOrNull,
} from '../shared/cli-option-parsing';
import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

export async function adaptBottomupContextCommand(
  params: FileCommandAdapterParams,
): Promise<string> {
  void params.command;
  try {
    const result = await executeBottomupContextTool({
      workspaceRoot: resolveFileWorkspaceRoot(),
      db: null as never,
      call: {
        type: 'bottomup_context',
        working_dir: stringOrNull(params.parsed.arguments.workingDir),
        scope_root: stringOrNull(params.parsed.options.scopeRoot),
        parent_depth: intOrNull(params.parsed.options.parents),
        child_depth: intOrNull(params.parsed.options.children),
        respect_gitignore: boolToOverride(
          params.parsed.options.noGitignore,
          false,
        ),
        exclude_hidden: boolToOverride(
          params.parsed.options.includeHidden,
          false,
        ),
        extra_ignore: csvToArrayOrNull(params.parsed.options.ignore),
      },
    });

    return result;
  } catch (err) {
    return String(err instanceof Error ? err.message : err);
  }
}

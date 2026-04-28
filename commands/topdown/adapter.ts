import type { FileCommandAdapterParams } from '../../types/adapter-params';

import {
  boolToOverride,
  csvToArrayOrNull,
  intOrNull,
  stringOrNull,
} from '../shared/cli-option-parsing';
import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import { executeTopdownTool } from './handler';

export async function adaptTopdownCommand(
  params: FileCommandAdapterParams,
): Promise<string> {
  void params.command;
  try {
    const result = await executeTopdownTool({
      workspaceRoot: resolveFileWorkspaceRoot(),
      db: null as never,
      call: {
        type: 'topdown',
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
        model: stringOrNull(params.parsed.options.model),
        force: params.parsed.options.force === true ? true : null,
      },
    });

    return result;
  } catch (err) {
    return String(err instanceof Error ? err.message : err);
  }
}

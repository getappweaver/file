import type { CommandDefinition } from '@src/system/command-definition';
import type { ParsedCliInvocation } from '@src/system/parser-cli';

import { createMessageRepresentation } from '../../output/message/builder';

import { executeBottomupContextTool } from '../bottomup/handler';
import {
  boolToOverride,
  csvToArrayOrNull,
  intOrNull,
  stringOrNull,
} from '../shared/cli-option-parsing';
import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

export async function adaptBottomupContextCommand(params: {
  alias: string;
  command: CommandDefinition;
  parsed: ParsedCliInvocation;
}) {
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

    return createMessageRepresentation({
      command: params.alias,
      subcommand: 'bottomup_context',
      tone: 'info',
      text: result,
    });
  } catch (err) {
    return createMessageRepresentation({
      command: params.alias,
      subcommand: 'bottomup_context',
      tone: 'error',
      text: String(err instanceof Error ? err.message : err),
    });
  }
}

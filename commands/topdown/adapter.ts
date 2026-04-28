import type { CommandDefinition } from '@src/system/command-definition';
import type { ParsedCliInvocation } from '@src/system/parser-cli';

import { createMessageRepresentation } from '../../output/message/builder';

import {
  boolToOverride,
  csvToArrayOrNull,
  intOrNull,
  stringOrNull,
} from '../shared/cli-option-parsing';
import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import { executeTopdownTool } from './handler';

export async function adaptTopdownCommand(params: {
  alias: string;
  command: CommandDefinition;
  parsed: ParsedCliInvocation;
}) {
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

    return createMessageRepresentation({
      command: params.alias,
      subcommand: 'topdown',
      tone: 'success',
      text: result,
    });
  } catch (err) {
    return createMessageRepresentation({
      command: params.alias,
      subcommand: 'topdown',
      tone: 'error',
      text: String(err instanceof Error ? err.message : err),
    });
  }
}

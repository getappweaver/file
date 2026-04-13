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

import { executeBottomupTool } from './handler';

export async function adaptBottomupCommand(params: {
  alias: string;
  command: CommandDefinition;
  parsed: ParsedCliInvocation;
}) {
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
      },
    });

    return createMessageRepresentation({
      command: params.alias,
      subcommand: 'bottomup',
      tone: 'success',
      text: result,
    });
  } catch (err) {
    return createMessageRepresentation({
      command: params.alias,
      subcommand: 'bottomup',
      tone: 'error',
      text: String(err instanceof Error ? err.message : err),
    });
  }
}

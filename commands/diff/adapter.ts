import type { CommandDefinition } from '@src/system/command-definition';
import type { ParsedCliInvocation } from '@src/system/parser-cli';

import { createMessageRepresentation } from '../../output/message/builder';

import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import {
  defaultDiffMaxBytes,
  handleDiffCommand,
  type FileDiffResult,
} from './handler';

function fileDiffResultToCliText(result: FileDiffResult): string {
  if (result.type === 'error') {
    return result.text;
  }

  const parts = [`Diff: ${result.relativePath}`];

  if (result.truncated) {
    parts.push(`(truncated to ${defaultDiffMaxBytes()} bytes for preview)`);
  }

  if (result.binary) {
    parts.push('(binary diff preview)');
  }

  parts.push('', ...result.lines.map((line) => line.text));

  return parts.join('\n');
}

export function adaptDiffCommand(params: {
  alias: string;
  parsed: ParsedCliInvocation;
  command: CommandDefinition;
}) {
  const pathRaw = params.parsed.arguments.path;

  const path =
    typeof pathRaw === 'string' && pathRaw.trim().length > 0
      ? pathRaw.trim()
      : null;

  if (path === null) {
    return createMessageRepresentation({
      command: params.alias,
      subcommand: 'diff',
      tone: 'error',
      text: 'Missing required path argument.',
    });
  }

  let workspaceRoot: string;

  try {
    workspaceRoot = resolveFileWorkspaceRoot();
  } catch (err) {
    return createMessageRepresentation({
      command: params.alias,
      subcommand: 'diff',
      tone: 'error',
      text: String(err instanceof Error ? err.message : err),
    });
  }

  const result = handleDiffCommand({
    workspaceRoot,
    relativePath: path,
    maxBytes: defaultDiffMaxBytes(),
  });

  return createMessageRepresentation({
    command: params.alias,
    subcommand: 'diff',
    tone: result.type === 'error' ? 'error' : 'info',
    text: fileDiffResultToCliText(result),
  });
}

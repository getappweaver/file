import type { CommandDefinition } from '@src/system/command-definition';
import type { ParsedCliInvocation } from '@src/system/parser-cli';

import { createMessageRepresentation } from '../../output/message/builder';

import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import {
  defaultViewMaxBytes,
  handleViewCommand,
  type FileViewResult,
} from './handler';

function fileViewResultToCliText(result: FileViewResult): string {
  if (result.type === 'error') {
    return result.text;
  }

  if (result.binary) {
    return `Binary file (${result.byteLength} bytes): ${result.relativePath}`;
  }

  const parts = [
    `File: ${result.relativePath}`,
    `Size: ${result.byteLength} bytes`,
  ];

  if (result.truncated) {
    parts.push(`(truncated to ${defaultViewMaxBytes()} bytes for preview)`);
  }

  parts.push('', result.content);

  return parts.join('\n');
}

export function adaptViewCommand(params: {
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
      subcommand: 'view',
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
      subcommand: 'view',
      tone: 'error',
      text: String(err instanceof Error ? err.message : err),
    });
  }

  const result = handleViewCommand({
    workspaceRoot,
    relativePath: path,
    maxBytes: defaultViewMaxBytes(),
  });

  if (result.type === 'error') {
    return createMessageRepresentation({
      command: params.alias,
      subcommand: 'view',
      tone: 'error',
      text: result.text,
    });
  }

  return createMessageRepresentation({
    command: params.alias,
    subcommand: 'view',
    tone: 'info',
    text: fileViewResultToCliText(result),
  });
}

import type { WebNodeRoot } from '@src/web/ui-schema';

import type { FileCommandAdapterParams } from '../../types/adapter-params';

import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import {
  defaultDiffMaxBytes,
  handleDiffCommand,
  type FileDiffResult,
} from './handler';
import { renderFileDiffWeb } from './renderers/web';

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

export function adaptDiffCommand(
  params: FileCommandAdapterParams,
): string | WebNodeRoot {
  const pathRaw = params.parsed.arguments.path;

  const path =
    typeof pathRaw === 'string' && pathRaw.trim().length > 0
      ? pathRaw.trim()
      : null;

  if (path === null) {
    return params.source === 'web'
      ? renderFileDiffWeb({
          commandAlias: params.alias,
          result: { type: 'error', text: 'Missing required path argument.' },
          previousDir: null,
        })
      : 'Missing required path argument.';
  }

  const previousDirRaw = params.parsed.options.previousDir;

  const previousDir =
    typeof previousDirRaw === 'string' && previousDirRaw.trim().length > 0
      ? previousDirRaw.trim()
      : null;

  let workspaceRoot: string;

  try {
    workspaceRoot = resolveFileWorkspaceRoot();
  } catch (err) {
    const text = String(err instanceof Error ? err.message : err);

    return params.source === 'web'
      ? renderFileDiffWeb({
          commandAlias: params.alias,
          result: { type: 'error', text },
          previousDir,
        })
      : text;
  }

  const result = handleDiffCommand({
    workspaceRoot,
    relativePath: path,
    maxBytes: defaultDiffMaxBytes(),
  });

  if (params.source === 'web') {
    return renderFileDiffWeb({
      commandAlias: params.alias,
      result,
      previousDir,
    });
  }

  return fileDiffResultToCliText(result);
}

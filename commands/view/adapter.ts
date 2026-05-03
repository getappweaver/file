import type { WebNodeRoot } from '@src/web/ui-schema';

import type { FileCommandAdapterParams } from '../../types/adapter-params';

import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import {
  defaultViewMaxBytes,
  handleViewCommand,
  type FileViewResult,
} from './handler';
import { renderFileViewWeb } from './renderers/web';

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

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function adaptViewCommand(
  params: FileCommandAdapterParams,
): string | WebNodeRoot {
  const pathRaw = params.parsed.arguments.path;

  const path =
    typeof pathRaw === 'string' && pathRaw.trim().length > 0
      ? pathRaw.trim()
      : null;

  if (path === null) {
    return params.source === 'web'
      ? renderFileViewWeb({
          commandAlias: params.alias,
          result: { type: 'error', text: 'Missing required path argument.' },
          previousDir: null,
          highlightLine: null,
        })
      : 'Missing required path argument.';
  }

  const previousDirRaw = params.parsed.options.previousDir;

  const previousDir =
    typeof previousDirRaw === 'string' && previousDirRaw.trim().length > 0
      ? previousDirRaw.trim()
      : null;

  const highlightLine = parsePositiveInteger(params.parsed.options.line);

  let workspaceRoot: string;

  try {
    workspaceRoot = resolveFileWorkspaceRoot();
  } catch (err) {
    const text = String(err instanceof Error ? err.message : err);

    return params.source === 'web'
      ? renderFileViewWeb({
          commandAlias: params.alias,
          result: { type: 'error', text },
          previousDir,
          highlightLine,
        })
      : text;
  }

  const result = handleViewCommand({
    workspaceRoot,
    relativePath: path,
    maxBytes: defaultViewMaxBytes(),
  });

  if (params.source === 'web') {
    return renderFileViewWeb({
      commandAlias: params.alias,
      result,
      previousDir,
      highlightLine,
    });
  }

  return fileViewResultToCliText(result);
}

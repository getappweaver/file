import type { WebHandlerResult } from '@src/web/ui-schema';

import type { FileCommandAdapterParams } from '../../types/adapter-params';

import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import { commitSelectedFiles, type CommitSelectedFilesResult } from './handler';

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function resultToText(result: CommitSelectedFilesResult): string {
  if (result.type === 'error') {
    return result.text;
  }

  return [
    `Committed ${result.hash}.`,
    `${result.committedFiles.length} file${result.committedFiles.length === 1 ? '' : 's'} included.`,
    result.summary,
  ]
    .filter((line) => line.trim().length > 0)
    .join('\n');
}

export function adaptCommitCommand(
  params: FileCommandAdapterParams,
): WebHandlerResult {
  const payload =
    typeof params.jsonPayload === 'object' && params.jsonPayload !== null
      ? (params.jsonPayload as Record<string, unknown>)
      : null;

  const messageFromPayload = payload?.message;
  const scopePath = payload?.scopePath;
  const selectedFiles = readStringArray(payload?.selectedFiles);
  const expectedStagedFiles = readStringArray(payload?.expectedStagedFiles);

  const message =
    typeof messageFromPayload === 'string'
      ? messageFromPayload
      : Object.values(params.parsed.arguments).join(' ');

  let workspaceRoot: string;

  try {
    workspaceRoot = resolveFileWorkspaceRoot();
  } catch (err) {
    return String(err instanceof Error ? err.message : err);
  }

  return resultToText(
    commitSelectedFiles({
      workspaceRoot,
      scopePath: typeof scopePath === 'string' ? scopePath : null,
      message,
      selectedFiles,
      expectedStagedFiles,
    }),
  );
}

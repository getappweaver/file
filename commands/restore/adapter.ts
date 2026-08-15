import type { WebHandlerResult } from '@src/web/ui-schema';

import type { FileCommandAdapterParams } from '../../types/adapter-params';

import { resolveFileRepositoryRoot } from '../shared/workspace-root';

import { restoreGitFile } from './handler';

export function adaptRestoreCommand(
  params: FileCommandAdapterParams,
): WebHandlerResult {
  const payload =
    typeof params.jsonPayload === 'object' && params.jsonPayload !== null
      ? (params.jsonPayload as Record<string, unknown>)
      : null;

  const fileFromPayload = payload?.file;
  const repositoryPath = payload?.repositoryPath;
  const fileFromArgs = params.parsed.arguments.file;

  const file =
    typeof fileFromPayload === 'string'
      ? fileFromPayload
      : typeof fileFromArgs === 'string'
        ? fileFromArgs
        : null;

  if (file === null) {
    return 'Missing file path.';
  }

  let repository: ReturnType<typeof resolveFileRepositoryRoot>;

  try {
    repository = resolveFileRepositoryRoot(
      typeof repositoryPath === 'string' ? repositoryPath : null,
    );
  } catch (err) {
    return String(err instanceof Error ? err.message : err);
  }

  return restoreGitFile({ workspaceRoot: repository.workspaceRoot, file }).text;
}

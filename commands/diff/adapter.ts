import type { WebHandlerResult } from '@src/web/ui-schema';

import type { FileCommandAdapterParams } from '../../types/adapter-params';

import { resolveFileRepositoryRoot } from '../shared/workspace-root';

import {
  defaultDiffMaxBytes,
  handleCommitTimelineDiffCommand,
  handleDiffCommand,
  handleTimelineDiffCommand,
  type FileDiffResult,
} from './handler';
import { renderFileDiffWeb, renderTimelineDiffOutput } from './renderers/web';

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
): WebHandlerResult {
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

  const timelineRaw = params.parsed.options.timeline;
  const timeline = timelineRaw === true || timelineRaw === 'true';
  const commitRaw = params.parsed.options.commit;
  const repositoryRaw = params.parsed.options.repository;

  const repositoryPath =
    typeof repositoryRaw === 'string' && repositoryRaw.trim().length > 0
      ? repositoryRaw.trim()
      : null;

  const commitHash =
    typeof commitRaw === 'string' && commitRaw.trim().length > 0
      ? commitRaw.trim()
      : null;

  let repository: ReturnType<typeof resolveFileRepositoryRoot>;

  try {
    repository = resolveFileRepositoryRoot(repositoryPath);
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

  if (params.source === 'web' && timeline) {
    const result =
      commitHash === null
        ? handleTimelineDiffCommand({
            workspaceRoot: repository.workspaceRoot,
            relativePath: path,
            maxBytes: defaultDiffMaxBytes(),
          })
        : handleCommitTimelineDiffCommand({
            workspaceRoot: repository.workspaceRoot,
            relativePath: path,
            maxBytes: defaultDiffMaxBytes(),
            commitHash,
          });

    if (result.type === 'error') {
      return result.text;
    }

    return renderTimelineDiffOutput({
      commandAlias: params.alias,
      result,
      repositoryPath: repository.repositoryPath,
    });
  }

  const result = handleDiffCommand({
    workspaceRoot: repository.workspaceRoot,
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

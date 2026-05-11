import type { WebNodeRoot } from '@src/web/ui-schema';

import type { FileCommandAdapterParams } from '../../types/adapter-params';

import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import { handleHistoryCommand, type FileHistoryResult } from './handler';
import { renderFileHistoryWeb } from './renderers/web';

function historyResultToCliText(result: FileHistoryResult): string {
  if (result.type === 'error') {
    return result.text;
  }

  if (result.commits.length === 0) {
    return `History: ${result.relativePath}\nNo commits found for this path.`;
  }

  return [
    `History: ${result.relativePath}`,
    '',
    ...result.commits.map(
      (commit) => `${commit.relativeTime}  ${commit.subject}`,
    ),
  ].join('\n');
}

export function adaptHistoryCommand(
  params: FileCommandAdapterParams,
): string | WebNodeRoot {
  const pathRaw = params.parsed.arguments.path;

  const path =
    typeof pathRaw === 'string' && pathRaw.trim().length > 0
      ? pathRaw.trim()
      : null;

  let workspaceRoot: string;

  try {
    workspaceRoot = resolveFileWorkspaceRoot();
  } catch (err) {
    const text = String(err instanceof Error ? err.message : err);

    return params.source === 'web'
      ? renderFileHistoryWeb({
          commandAlias: params.alias,
          result: { type: 'error', text },
        })
      : text;
  }

  const result = handleHistoryCommand({
    workspaceRoot,
    relativePath: path,
    maxCount: 20,
  });

  if (params.source === 'web') {
    return renderFileHistoryWeb({
      commandAlias: params.alias,
      result,
    });
  }

  return historyResultToCliText(result);
}

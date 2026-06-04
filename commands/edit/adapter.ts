import type { WebHandlerResult } from '@src/web/ui-schema';

import type { FileCommandAdapterParams } from '../../types/adapter-params';

import {
  defaultDiffMaxBytes,
  handleTimelineDiffCommand,
} from '../diff/handler';
import { renderTimelineDiffOutput } from '../diff/renderers/web';
import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import { handleEditCommand } from './handler';

export function adaptEditCommand(
  params: FileCommandAdapterParams,
): WebHandlerResult {
  const pathRaw = params.parsed.arguments.path;
  const contentRaw = params.parsed.arguments.content;

  const path =
    typeof pathRaw === 'string' && pathRaw.trim().length > 0
      ? pathRaw.trim()
      : null;

  const content =
    typeof contentRaw === 'string'
      ? contentRaw
      : Array.isArray(contentRaw)
        ? contentRaw.map(String).join(' ')
        : null;

  if (path === null || content === null) {
    return 'Missing required path or content argument.';
  }

  let workspaceRoot: string;

  try {
    workspaceRoot = resolveFileWorkspaceRoot();
  } catch (err) {
    return String(err instanceof Error ? err.message : err);
  }

  const editResult = handleEditCommand({
    workspaceRoot,
    relativePath: path,
    content,
  });

  if (editResult.type === 'error') {
    return editResult.text;
  }

  if (params.source !== 'web') {
    return `Updated ${editResult.relativePath}`;
  }

  const diffResult = handleTimelineDiffCommand({
    workspaceRoot,
    relativePath: editResult.relativePath,
    maxBytes: defaultDiffMaxBytes(),
  });

  return renderTimelineDiffOutput({
    commandAlias: params.alias,
    result: diffResult,
    savedPath: editResult.relativePath,
  });
}

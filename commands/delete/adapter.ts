import type { WebHandlerResult } from '@src/web/ui-schema';

import type { FileCommandAdapterParams } from '../../types/adapter-params';

import { resolveFileWorkspaceRoot } from '../shared/workspace-root';
import { renderTreeForWeb } from '../tree/adapter';

import { handleDeleteCommand } from './handler';

export function adaptDeleteCommand(
  params: FileCommandAdapterParams,
): WebHandlerResult {
  const pathRaw = params.parsed.arguments.path;
  const path = typeof pathRaw === 'string' ? pathRaw.trim() : null;

  if (path === null) {
    return 'Missing required path argument.';
  }

  let workspaceRoot: string;

  try {
    workspaceRoot = resolveFileWorkspaceRoot();
  } catch (err) {
    return String(err instanceof Error ? err.message : err);
  }

  const result = handleDeleteCommand({
    workspaceRoot,
    relativePath: path,
  });

  if (result.type === 'error') {
    return result.text;
  }

  if (params.source !== 'web') {
    return `Deleted ${result.relativePath}`;
  }

  return renderTreeForWeb({
    commandAlias: params.alias,
    targetDirRelative:
      typeof params.parsed.options.treeDir === 'string'
        ? params.parsed.options.treeDir
        : null,
    extOption:
      typeof params.parsed.options.ext === 'string'
        ? params.parsed.options.ext
        : null,
    expandedOption:
      typeof params.parsed.options.expanded === 'string'
        ? params.parsed.options.expanded
        : null,
    revealPath: result.parentDir,
  });
}

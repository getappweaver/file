import type { WebHandlerResult } from '@src/web/ui-schema';

import type { FileCommandAdapterParams } from '../../types/adapter-params';

import { resolveFileWorkspaceRoot } from '../shared/workspace-root';
import { renderTreeForWeb } from '../tree/adapter';

import { handleRenameCommand } from './handler';

export function adaptRenameCommand(
  params: FileCommandAdapterParams,
): WebHandlerResult {
  const pathRaw = params.parsed.arguments.path;
  const nameRaw = params.parsed.arguments.name;

  const path = typeof pathRaw === 'string' ? pathRaw.trim() : null;
  const name = typeof nameRaw === 'string' ? nameRaw.trim() : null;

  if (path === null || name === null) {
    return 'Missing required path or new name argument.';
  }

  let workspaceRoot: string;

  try {
    workspaceRoot = resolveFileWorkspaceRoot();
  } catch (err) {
    return String(err instanceof Error ? err.message : err);
  }

  const result = handleRenameCommand({
    workspaceRoot,
    relativePath: path,
    newName: name,
  });

  if (result.type === 'error') {
    return result.text;
  }

  if (params.source !== 'web') {
    return `Renamed ${result.oldRelativePath} to ${result.newRelativePath}`;
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
    revealPath: result.newRelativePath,
  });
}

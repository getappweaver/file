import type { WebHandlerResult } from '@src/web/ui-schema';

import type { FileCommandAdapterParams } from '../../types/adapter-params';

import { resolveFileWorkspaceRoot } from '../shared/workspace-root';
import { renderTreeForWeb } from '../tree/adapter';

import { handleCreateCommand } from './handler';

export function adaptCreateCommand(
  params: FileCommandAdapterParams,
): WebHandlerResult {
  const dirRaw = params.parsed.arguments.dir;
  const nameRaw = params.parsed.arguments.name;

  const dir = typeof dirRaw === 'string' ? dirRaw.trim() : null;
  const name = typeof nameRaw === 'string' ? nameRaw.trim() : null;

  if (dir === null || name === null) {
    return 'Missing required directory or filename argument.';
  }

  let workspaceRoot: string;

  try {
    workspaceRoot = resolveFileWorkspaceRoot();
  } catch (err) {
    return String(err instanceof Error ? err.message : err);
  }

  const result = handleCreateCommand({
    workspaceRoot,
    relativeDir: dir,
    filename: name,
  });

  if (result.type === 'error') {
    return result.text;
  }

  if (params.source !== 'web') {
    return `Created ${result.relativePath}`;
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
    revealPath: result.relativePath,
  });
}

import type { WebHandlerResult } from '@src/web/ui-schema';

import type { FileCommandAdapterParams } from '../../types/adapter-params';

import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import { handleInitCommand } from './handler';

export function adaptInitCommand(
  _params: FileCommandAdapterParams,
): WebHandlerResult {
  let workspaceRoot: string;

  try {
    workspaceRoot = resolveFileWorkspaceRoot();
  } catch (err) {
    return String(err instanceof Error ? err.message : err);
  }

  const result = handleInitCommand({ workspaceRoot });

  return result.text;
}

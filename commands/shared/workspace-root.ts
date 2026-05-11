// ---------------------------------------------------------------------------
// plugins/file/workspace-root.ts — resolve workspace root from core DB + AppWeaver paths
// ---------------------------------------------------------------------------

import { join } from 'path';

import { getWorkspaceTarget, openCoreDb } from '@src/db';
import { dmBotRoot } from '@src/paths';

export function resolveFileWorkspaceRoot(): string {
  const db = openCoreDb();

  try {
    const ws = getWorkspaceTarget(db);

    return ws === 'appweaver' ? dmBotRoot : join(dmBotRoot, '..');
  } finally {
    db.close();
  }
}

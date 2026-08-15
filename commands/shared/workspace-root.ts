// ---------------------------------------------------------------------------
// plugins/file/workspace-root.ts — resolve workspace root from core DB + AppWeaver paths
// ---------------------------------------------------------------------------

import { existsSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';

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

export function resolveFileRepositoryRoot(repositoryPath: string | null): {
  workspaceRoot: string;
  repositoryPath: string | null;
} {
  const workspaceRoot = resolveFileWorkspaceRoot();

  if (repositoryPath === null || repositoryPath.trim().length === 0) {
    return { workspaceRoot, repositoryPath: null };
  }

  const candidate = resolve(workspaceRoot, repositoryPath.trim());
  const underWorkspace = relative(workspaceRoot, candidate);

  if (
    underWorkspace === '..' ||
    underWorkspace.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)
  ) {
    throw new Error('Repository path escapes workspace.');
  }

  if (!existsSync(candidate) || !statSync(candidate).isDirectory()) {
    throw new Error(`Repository path is not a directory: ${repositoryPath}`);
  }

  const result = Bun.spawnSync(['git', 'rev-parse', '--show-toplevel'], {
    cwd: candidate,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  if (result.exitCode !== 0) {
    throw new Error(`Not a git repository: ${repositoryPath}`);
  }

  const gitRoot = resolve(result.stdout.toString().trim());
  const gitRootUnderWorkspace = relative(workspaceRoot, gitRoot);

  if (
    gitRootUnderWorkspace === '..' ||
    gitRootUnderWorkspace.startsWith(
      `..${process.platform === 'win32' ? '\\' : '/'}`,
    )
  ) {
    throw new Error('Git repository escapes workspace.');
  }

  return {
    workspaceRoot: gitRoot,
    repositoryPath: gitRootUnderWorkspace.replace(/\\/g, '/') || '.',
  };
}

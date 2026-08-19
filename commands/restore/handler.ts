import { existsSync, rmSync } from 'fs';
import { relative, resolve } from 'path';

import { spawnSync } from 'bun';

export type RestoreFileResult =
  { type: 'ok'; text: string } | { type: 'error'; text: string };

function runGit(props: {
  workspaceRoot: string;
  args: string[];
}): { ok: true; stdout: string } | { ok: false; text: string } {
  const result = spawnSync(['git', ...props.args], {
    cwd: props.workspaceRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const stdout = Buffer.from(result.stdout).toString('utf8').trim();
  const stderr = Buffer.from(result.stderr).toString('utf8').trim();

  if (result.exitCode !== 0) {
    return { ok: false, text: stderr || stdout || 'Git command failed.' };
  }

  return { ok: true, stdout };
}

function resolveWorkspacePath(props: {
  workspaceRoot: string;
  file: string;
}): { abs: string; relPosix: string } | RestoreFileResult {
  const rel = props.file.trim();

  if (rel.length === 0) {
    return { type: 'error', text: 'Missing file path.' };
  }

  const abs = resolve(props.workspaceRoot, rel);
  const under = relative(props.workspaceRoot, abs);

  if (under.startsWith('..') || under === '..') {
    return { type: 'error', text: 'Path escapes workspace.' };
  }

  return { abs, relPosix: under.replace(/\\/g, '/') };
}

function isTrackedInHead(props: {
  workspaceRoot: string;
  relPosix: string;
}): boolean {
  const result = spawnSync(
    ['git', 'cat-file', '-e', `HEAD:${props.relPosix}`],
    {
      cwd: props.workspaceRoot,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );

  return result.exitCode === 0;
}

export function restoreGitFile(props: {
  workspaceRoot: string;
  file: string;
}): RestoreFileResult {
  const resolved = resolveWorkspacePath(props);

  if ('type' in resolved) {
    return resolved;
  }

  const { abs, relPosix } = resolved;

  const trackedInHead = isTrackedInHead({
    workspaceRoot: props.workspaceRoot,
    relPosix,
  });

  const unstage = runGit({
    workspaceRoot: props.workspaceRoot,
    args: ['restore', '--staged', '--', relPosix],
  });

  if (!unstage.ok && !unstage.text.includes('did not match any file')) {
    return { type: 'error', text: unstage.text };
  }

  if (!trackedInHead) {
    if (existsSync(abs)) {
      rmSync(abs, { force: true, recursive: false });
    }

    return { type: 'ok', text: `Restored ${relPosix}.` };
  }

  const restore = runGit({
    workspaceRoot: props.workspaceRoot,
    args: ['restore', '--', relPosix],
  });

  if (!restore.ok) {
    return { type: 'error', text: restore.text };
  }

  return { type: 'ok', text: `Restored ${relPosix}.` };
}

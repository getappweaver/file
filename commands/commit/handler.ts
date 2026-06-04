import { spawnSync } from 'bun';

import { listStagedFiles } from '../diff/handler';

type CommitSelectedFilesProps = {
  workspaceRoot: string;
  scopePath: string | null;
  message: string;
  selectedFiles: string[];
  expectedStagedFiles: string[];
};

export type CommitSelectedFilesResult =
  | {
      type: 'ok';
      hash: string;
      summary: string;
      committedFiles: string[];
    }
  | { type: 'error'; text: string };

function splitNulPaths(stdout: Uint8Array): string[] {
  return Buffer.from(stdout)
    .toString('utf8')
    .split('\0')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim())))
    .filter((value) => value.length > 0)
    .sort();
}

function sameStringSet(left: string[], right: string[]): boolean {
  const a = uniqueSorted(left);
  const b = uniqueSorted(right);

  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function listChangedFiles(workspaceRoot: string): string[] {
  const tracked = spawnSync(
    ['git', 'diff', '--name-only', 'HEAD', '-z', '--'],
    {
      cwd: workspaceRoot,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );

  const untracked = spawnSync(
    ['git', 'ls-files', '--others', '--exclude-standard', '-z', '--'],
    {
      cwd: workspaceRoot,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );

  return uniqueSorted([
    ...(tracked.exitCode === 0 ? splitNulPaths(tracked.stdout) : []),
    ...(untracked.exitCode === 0 ? splitNulPaths(untracked.stdout) : []),
  ]);
}

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

export function commitSelectedFiles(
  props: CommitSelectedFilesProps,
): CommitSelectedFilesResult {
  const message = props.message.trim();

  if (message.length === 0) {
    return { type: 'error', text: 'Commit message is required.' };
  }

  const selectedFiles = uniqueSorted(props.selectedFiles);

  if (selectedFiles.length === 0) {
    return { type: 'error', text: 'Select at least one file to commit.' };
  }

  const currentStagedFiles = listStagedFiles({
    workspaceRoot: props.workspaceRoot,
    pathspec: props.scopePath,
  });

  if (!sameStringSet(currentStagedFiles, props.expectedStagedFiles)) {
    return {
      type: 'error',
      text: 'Git index changed since this diff was rendered. Refresh before committing.',
    };
  }

  const changedFiles = new Set(listChangedFiles(props.workspaceRoot));
  const filesToCommit = selectedFiles.filter((file) => changedFiles.has(file));

  if (filesToCommit.length === 0) {
    return { type: 'error', text: 'No selected files have changes to commit.' };
  }

  const stagedButNotSelected = currentStagedFiles.filter(
    (file) => !selectedFiles.includes(file),
  );

  const addResult = runGit({
    workspaceRoot: props.workspaceRoot,
    args: ['add', '--', ...filesToCommit],
  });

  if (!addResult.ok) {
    return { type: 'error', text: addResult.text };
  }

  if (stagedButNotSelected.length > 0) {
    const unstageResult = runGit({
      workspaceRoot: props.workspaceRoot,
      args: ['restore', '--staged', '--', ...stagedButNotSelected],
    });

    if (!unstageResult.ok) {
      return { type: 'error', text: unstageResult.text };
    }
  }

  const commitResult = runGit({
    workspaceRoot: props.workspaceRoot,
    args: ['commit', '-m', message],
  });

  if (!commitResult.ok) {
    return { type: 'error', text: commitResult.text };
  }

  const hashResult = runGit({
    workspaceRoot: props.workspaceRoot,
    args: ['rev-parse', '--short', 'HEAD'],
  });

  return {
    type: 'ok',
    hash: hashResult.ok ? hashResult.stdout : 'HEAD',
    summary: commitResult.stdout,
    committedFiles: filesToCommit,
  };
}

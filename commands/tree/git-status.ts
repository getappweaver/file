import { posix } from 'path';

import { spawnSync } from 'bun';

export type WorkspaceGitStatusKind =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'untracked'
  | 'conflicted';

export type WorkspaceGitStatusDecoration = {
  kind: WorkspaceGitStatusKind;
  label: string;
  scope: 'file' | 'directory';
};

type GitStatusEntry = {
  x: string;
  y: string;
  path: string;
};

const GIT_STATUS_LABEL: Record<WorkspaceGitStatusKind, string> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
  renamed: 'R',
  untracked: 'U',
  conflicted: 'C',
};

const GIT_STATUS_PRIORITY: Record<WorkspaceGitStatusKind, number> = {
  conflicted: 6,
  deleted: 5,
  modified: 4,
  renamed: 3,
  added: 2,
  untracked: 1,
};

function parseGitStatusEntries(output: string): GitStatusEntry[] {
  const entries: GitStatusEntry[] = [];
  let cursor = 0;

  while (cursor < output.length) {
    const x = output[cursor];
    const y = output[cursor + 1];

    if (x === undefined || y === undefined) {
      break;
    }

    cursor += 3;

    const firstNull = output.indexOf('\0', cursor);

    if (firstNull < 0) {
      break;
    }

    const firstPath = output.slice(cursor, firstNull);
    cursor = firstNull + 1;

    let path = firstPath;

    if (x === 'R' || y === 'R' || x === 'C' || y === 'C') {
      const secondNull = output.indexOf('\0', cursor);

      if (secondNull < 0) {
        break;
      }

      path = output.slice(cursor, secondNull);
      cursor = secondNull + 1;
    }

    entries.push({ x, y, path });
  }

  return entries;
}

function statusKindFromEntry(
  entry: GitStatusEntry,
): WorkspaceGitStatusKind | null {
  const code = `${entry.x}${entry.y}`;

  if (
    entry.x === 'U' ||
    entry.y === 'U' ||
    code === 'AA' ||
    code === 'DD' ||
    code === 'AU' ||
    code === 'UD' ||
    code === 'UA' ||
    code === 'DU' ||
    code === 'UU'
  ) {
    return 'conflicted';
  }

  if (code === '??') {
    return 'untracked';
  }

  if (entry.x === 'D' || entry.y === 'D') {
    return 'deleted';
  }

  if (
    entry.x === 'M' ||
    entry.y === 'M' ||
    entry.x === 'T' ||
    entry.y === 'T'
  ) {
    return 'modified';
  }

  if (entry.x === 'R' || entry.y === 'R') {
    return 'renamed';
  }

  if (
    entry.x === 'C' ||
    entry.y === 'C' ||
    entry.x === 'A' ||
    entry.y === 'A'
  ) {
    return 'added';
  }

  return null;
}

function decorationForKind(props: {
  kind: WorkspaceGitStatusKind;
  scope: 'file' | 'directory';
}): WorkspaceGitStatusDecoration {
  return {
    kind: props.kind,
    label: GIT_STATUS_LABEL[props.kind],
    scope: props.scope,
  };
}

function mergeDecorations(
  current: WorkspaceGitStatusDecoration | undefined,
  next: WorkspaceGitStatusDecoration,
): WorkspaceGitStatusDecoration {
  if (!current) {
    return next;
  }

  return GIT_STATUS_PRIORITY[next.kind] > GIT_STATUS_PRIORITY[current.kind]
    ? next
    : current;
}

export function collectWorkspaceGitStatusDecorations(
  workspaceRoot: string,
): Map<string, WorkspaceGitStatusDecoration> {
  const gitResult = spawnSync(
    ['git', 'status', '--porcelain=v1', '-z', '--untracked-files=all'],
    {
      cwd: workspaceRoot,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );

  if (gitResult.exitCode !== 0) {
    return new Map();
  }

  const output = Buffer.from(gitResult.stdout).toString('utf8');
  const entries = parseGitStatusEntries(output);
  const decorations = new Map<string, WorkspaceGitStatusDecoration>();

  entries.forEach((entry) => {
    const kind = statusKindFromEntry(entry);

    if (kind === null || entry.path.length === 0) {
      return;
    }

    decorations.set(
      entry.path,
      mergeDecorations(
        decorations.get(entry.path),
        decorationForKind({ kind, scope: 'file' }),
      ),
    );

    let parentDir = posix.dirname(entry.path);

    while (parentDir !== '.' && parentDir !== '') {
      decorations.set(
        parentDir,
        mergeDecorations(
          decorations.get(parentDir),
          decorationForKind({ kind, scope: 'directory' }),
        ),
      );

      parentDir = posix.dirname(parentDir);
    }
  });

  return decorations;
}

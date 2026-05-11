import { relative, resolve } from 'path';

import { spawnSync } from 'bun';

export type FileHistoryCommit = {
  hash: string;
  relativeTime: string;
  author: string;
  subject: string;
  fileCount: number;
  additions: number;
  deletions: number;
};

export type FileHistoryResult =
  | {
      type: 'ok';
      relativePath: string;
      commits: FileHistoryCommit[];
    }
  | { type: 'error'; text: string };

type HandleHistoryCommandProps = {
  workspaceRoot: string;
  relativePath: string | null;
  maxCount: number;
};

function resolveWorkspacePath(props: {
  workspaceRoot: string;
  relativePath: string | null;
}): { relPosix: string } | { type: 'error'; text: string } {
  const raw = props.relativePath?.trim() || '.';
  const abs = resolve(props.workspaceRoot, raw);
  const under = relative(props.workspaceRoot, abs);

  if (under.startsWith('..') || under === '..') {
    return { type: 'error', text: 'Path escapes workspace.' };
  }

  return { relPosix: under.length === 0 ? '.' : under.replace(/\\/g, '/') };
}

function isGitRepo(workspaceRoot: string): boolean {
  const result = spawnSync(['git', 'rev-parse', '--is-inside-work-tree'], {
    cwd: workspaceRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  return result.exitCode === 0;
}

function parseGitLog(output: string): FileHistoryCommit[] {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [hash = '', relativeTime = '', author = '', ...subjectParts] =
        line.split('\t');

      return {
        hash,
        relativeTime,
        author,
        subject: subjectParts.join('\t'),
        fileCount: 0,
        additions: 0,
        deletions: 0,
      };
    })
    .filter((commit) => commit.hash.length > 0);
}

function readCommitStats(props: {
  workspaceRoot: string;
  commitHash: string;
  relativePath: string;
}): Pick<FileHistoryCommit, 'fileCount' | 'additions' | 'deletions'> {
  const args = [
    'git',
    '--no-pager',
    'show',
    '--format=',
    '--numstat',
    props.commitHash,
  ];

  if (props.relativePath !== '.') {
    args.push('--', props.relativePath);
  }

  const result = spawnSync(args, {
    cwd: props.workspaceRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  if (result.exitCode !== 0) {
    return { fileCount: 0, additions: 0, deletions: 0 };
  }

  return Buffer.from(result.stdout)
    .toString('utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .reduce(
      (stats, line) => {
        const [addRaw, delRaw] = line.split('\t');
        const additions = Number(addRaw);
        const deletions = Number(delRaw);

        return {
          fileCount: stats.fileCount + 1,
          additions:
            stats.additions + (Number.isFinite(additions) ? additions : 0),
          deletions:
            stats.deletions + (Number.isFinite(deletions) ? deletions : 0),
        };
      },
      { fileCount: 0, additions: 0, deletions: 0 },
    );
}

export function handleHistoryCommand(
  props: HandleHistoryCommandProps,
): FileHistoryResult {
  const resolved = resolveWorkspacePath({
    workspaceRoot: props.workspaceRoot,
    relativePath: props.relativePath,
  });

  if ('type' in resolved) {
    return resolved;
  }

  if (!isGitRepo(props.workspaceRoot)) {
    return {
      type: 'error',
      text: 'This workspace is not a git repository, so AppWeaver cannot show file history here.',
    };
  }

  const args = [
    'git',
    '--no-pager',
    'log',
    `--max-count=${props.maxCount}`,
    '--date=relative',
    '--pretty=format:%h%x09%ar%x09%an%x09%s',
  ];

  if (resolved.relPosix !== '.') {
    args.push('--', resolved.relPosix);
  }

  const result = spawnSync(args, {
    cwd: props.workspaceRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  if (result.exitCode !== 0) {
    const stderr = Buffer.from(result.stderr).toString('utf8').trim();

    return {
      type: 'error',
      text: stderr.length > 0 ? stderr : 'Failed to read git history.',
    };
  }

  return {
    type: 'ok',
    relativePath: resolved.relPosix,
    commits: parseGitLog(Buffer.from(result.stdout).toString('utf8')).map(
      (commit) => ({
        ...commit,
        ...readCommitStats({
          workspaceRoot: props.workspaceRoot,
          commitHash: commit.hash,
          relativePath: resolved.relPosix,
        }),
      }),
    ),
  };
}

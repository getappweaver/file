import { existsSync, readFileSync, statSync } from 'fs';
import { relative, resolve } from 'path';

import { spawnSync } from 'bun';

import type { AgentFileDiff } from '@src/backends/agent-stream-chunk';

const DEFAULT_MAX_DIFF_BYTES = 256 * 1024;

type FileDiffLineKind = 'header' | 'hunk' | 'add' | 'remove' | 'context';

export type FileDiffLine = {
  kind: FileDiffLineKind;
  oldLine: number | null;
  newLine: number | null;
  text: string;
};

export type FileDiffOk = {
  type: 'ok';
  relativePath: string;
  lines: FileDiffLine[];
  truncated: boolean;
  binary: boolean;
};

export type FileDiffErr = {
  type: 'error';
  text: string;
  reason?: 'git_unavailable';
};

export type FileDiffResult = FileDiffOk | FileDiffErr;

type ResolveWorkspaceFilePathProps = {
  workspaceRoot: string;
  relativePath: string;
};

type HandleDiffCommandProps = {
  workspaceRoot: string;
  relativePath: string;
  maxBytes: number;
};

type HandleCommitTimelineDiffCommandProps = HandleDiffCommandProps & {
  commitHash: string;
};

export type TimelineDiffResult =
  | {
      type: 'ok';
      relativePath: string;
      files: AgentFileDiff[];
      truncated: boolean;
      commit: { subject: string; relativeTime: string } | null;
      stagedFiles: string[];
    }
  | FileDiffErr;

function resolveWorkspaceFilePath({
  workspaceRoot,
  relativePath,
}: ResolveWorkspaceFilePathProps):
  | { abs: string; relPosix: string }
  | FileDiffErr {
  const rel = relativePath.trim();

  if (rel.length === 0) {
    return { type: 'error', text: 'Missing file path.' };
  }

  const abs = resolve(workspaceRoot, rel);
  const under = relative(workspaceRoot, abs);

  if (under.startsWith('..') || under === '..') {
    return { type: 'error', text: 'Path escapes workspace.' };
  }

  return {
    abs,
    relPosix: under.length === 0 ? '.' : under.replace(/\\/g, '/'),
  };
}

function parseDiffLines(text: string): FileDiffLine[] {
  let oldLine: number | null = null;
  let newLine: number | null = null;

  return text.split('\n').map((line) => {
    if (
      line.startsWith('diff --git ') ||
      line.startsWith('index ') ||
      line.startsWith('new file mode ') ||
      line.startsWith('deleted file mode ') ||
      line.startsWith('similarity index ') ||
      line.startsWith('rename from ') ||
      line.startsWith('rename to ') ||
      line.startsWith('--- ') ||
      line.startsWith('+++ ') ||
      line.startsWith('Binary files ')
    ) {
      return { kind: 'header', oldLine: null, newLine: null, text: line };
    }

    if (line.startsWith('@@')) {
      const match = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);

      oldLine = match ? Number(match[1]) : null;
      newLine = match ? Number(match[2]) : null;

      return { kind: 'hunk', oldLine: null, newLine: null, text: line };
    }

    if (line.startsWith('+')) {
      const currentNewLine = newLine;

      if (newLine !== null) {
        newLine += 1;
      }

      return {
        kind: 'add',
        oldLine: null,
        newLine: currentNewLine,
        text: line,
      };
    }

    if (line.startsWith('-')) {
      const currentOldLine = oldLine;

      if (oldLine !== null) {
        oldLine += 1;
      }

      return {
        kind: 'remove',
        oldLine: currentOldLine,
        newLine: null,
        text: line,
      };
    }

    if (line.startsWith('\\ ')) {
      return { kind: 'header', oldLine: null, newLine: null, text: line };
    }

    const currentOldLine = oldLine;
    const currentNewLine = newLine;

    if (oldLine !== null) {
      oldLine += 1;
    }

    if (newLine !== null) {
      newLine += 1;
    }

    return {
      kind: 'context',
      oldLine: currentOldLine,
      newLine: currentNewLine,
      text: line,
    };
  });
}

function truncateUtf8Text(
  text: string,
  maxBytes: number,
): {
  text: string;
  truncated: boolean;
} {
  const buf = Buffer.from(text, 'utf8');

  if (buf.byteLength <= maxBytes) {
    return { text, truncated: false };
  }

  return {
    text: buf.subarray(0, maxBytes).toString('utf8'),
    truncated: true,
  };
}

function buildUntrackedDiff(props: {
  relativePath: string;
  absPath: string;
  maxBytes: number;
}): FileDiffResult {
  const fileBuffer = readFileSync(props.absPath);
  const truncated = fileBuffer.byteLength > props.maxBytes;
  const slice = fileBuffer.subarray(0, props.maxBytes);

  if (slice.includes(0)) {
    return {
      type: 'ok',
      relativePath: props.relativePath,
      lines: [
        {
          kind: 'header',
          oldLine: null,
          newLine: null,
          text: `Untracked binary file: ${props.relativePath}`,
        },
      ],
      truncated,
      binary: true,
    };
  }

  const content = slice.toString('utf8');
  const contentLines = content.split('\n');
  const hunkSize = content.length === 0 ? 0 : contentLines.length;

  const lines = [
    {
      kind: 'header' as const,
      oldLine: null,
      newLine: null,
      text: `diff --git a/${props.relativePath} b/${props.relativePath}`,
    },
    {
      kind: 'header' as const,
      oldLine: null,
      newLine: null,
      text: 'new file mode 100644',
    },
    {
      kind: 'header' as const,
      oldLine: null,
      newLine: null,
      text: '--- /dev/null',
    },
    {
      kind: 'header' as const,
      oldLine: null,
      newLine: null,
      text: `+++ b/${props.relativePath}`,
    },
    {
      kind: 'hunk' as const,
      oldLine: null,
      newLine: null,
      text: `@@ -0,0 +1,${hunkSize} @@`,
    },
    ...contentLines.map((line, index) => ({
      kind: 'add' as const,
      oldLine: null,
      newLine: index + 1,
      text: `+${line}`,
    })),
  ];

  return {
    type: 'ok',
    relativePath: props.relativePath,
    lines,
    truncated,
    binary: false,
  };
}

function gitUnavailableError(): FileDiffErr {
  return {
    type: 'error',
    reason: 'git_unavailable',
    text: 'Diff unavailable: this workspace is not a Git repository.',
  };
}

function isUntrackedStatus(statusText: string): boolean {
  return statusText
    .split('\n')
    .some((line) => line.trimStart().startsWith('?? '));
}

function fileDiffOkToAgentFileDiff(diff: FileDiffOk): AgentFileDiff {
  const patch = diff.lines.map((line) => line.text).join('\n');

  return {
    file: diff.relativePath,
    patch,
    additions: diff.lines.filter((line) => line.kind === 'add').length,
    deletions: diff.lines.filter((line) => line.kind === 'remove').length,
    status: 'added',
  };
}

function parseGitPatchFiles(patchText: string): AgentFileDiff[] {
  return patchText
    .split(/(?=^diff --git )/m)
    .map((chunk) => chunk.trimEnd())
    .filter((chunk) => chunk.trim().length > 0)
    .map((chunk) => {
      const lines = chunk.split('\n');
      const header = lines[0] ?? '';
      const headerMatch = /^diff --git a\/(.+) b\/(.+)$/.exec(header);
      const plusLine = lines.find((line) => line.startsWith('+++ b/'));
      const minusLine = lines.find((line) => line.startsWith('--- a/'));

      const file =
        plusLine?.slice('+++ b/'.length) ??
        minusLine?.slice('--- a/'.length) ??
        headerMatch?.[2] ??
        headerMatch?.[1] ??
        '(unknown)';

      const additions = lines.filter(
        (line) => line.startsWith('+') && !line.startsWith('+++'),
      ).length;

      const deletions = lines.filter(
        (line) => line.startsWith('-') && !line.startsWith('---'),
      ).length;

      const status = lines.some((line) => line.startsWith('new file mode '))
        ? 'added'
        : lines.some((line) => line.startsWith('deleted file mode '))
          ? 'deleted'
          : 'modified';

      return {
        file,
        patch: chunk,
        additions,
        deletions,
        status,
      };
    });
}

function untrackedDiffToTimelineFile(
  result: FileDiffResult,
): AgentFileDiff | null {
  if (result.type === 'error') {
    return null;
  }

  return {
    file: result.relativePath,
    patch: result.lines.map((line) => line.text).join('\n'),
    additions: result.lines.filter((line) => line.kind === 'add').length,
    deletions: 0,
    status: 'added',
  };
}

function readCommitMetadata(props: {
  workspaceRoot: string;
  commitHash: string;
}): { subject: string; relativeTime: string } | null {
  const result = spawnSync(
    [
      'git',
      '--no-pager',
      'show',
      '-s',
      '--date=relative',
      '--pretty=format:%s%x09%ar',
      props.commitHash,
    ],
    {
      cwd: props.workspaceRoot,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );

  if (result.exitCode !== 0) {
    return null;
  }

  const [subject = '', relativeTime = ''] = Buffer.from(result.stdout)
    .toString('utf8')
    .split('\t');

  if (subject.trim().length === 0 || relativeTime.trim().length === 0) {
    return null;
  }

  return { subject: subject.trim(), relativeTime: relativeTime.trim() };
}

function listUntrackedFiles(props: {
  workspaceRoot: string;
  relPosix: string;
}): string[] {
  const result = spawnSync(
    ['git', 'ls-files', '--others', '--exclude-standard', '--', props.relPosix],
    {
      cwd: props.workspaceRoot,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );

  if (result.exitCode !== 0) {
    return [];
  }

  return Buffer.from(result.stdout)
    .toString('utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function splitNulPaths(stdout: Uint8Array): string[] {
  return Buffer.from(stdout)
    .toString('utf8')
    .split('\0')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function listStagedFiles(props: {
  workspaceRoot: string;
  pathspec: string | null;
}): string[] {
  const args = ['git', 'diff', '--name-only', '--cached', '-z', '--'];

  if (props.pathspec !== null) {
    args.push(props.pathspec);
  }

  const result = spawnSync(args, {
    cwd: props.workspaceRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  if (result.exitCode !== 0) {
    return [];
  }

  return splitNulPaths(result.stdout);
}

export function handleDiffCommand(
  props: HandleDiffCommandProps,
): FileDiffResult {
  const resolved = resolveWorkspaceFilePath({
    workspaceRoot: props.workspaceRoot,
    relativePath: props.relativePath,
  });

  if ('type' in resolved) {
    return resolved;
  }

  const { abs, relPosix } = resolved;
  const exists = existsSync(abs);

  if (exists) {
    const st = statSync(abs);

    if (st.isDirectory()) {
      return { type: 'error', text: `Not a file: ${relPosix}` };
    }
  }

  const statusResult = spawnSync(
    ['git', 'status', '--porcelain=v1', '--', relPosix],
    {
      cwd: props.workspaceRoot,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );

  if (statusResult.exitCode !== 0) {
    return gitUnavailableError();
  }

  const statusText = Buffer.from(statusResult.stdout).toString('utf8').trim();
  const isUntracked = isUntrackedStatus(statusText);

  if (isUntracked) {
    if (!exists) {
      return { type: 'error', text: `Not found: ${relPosix}` };
    }

    return buildUntrackedDiff({
      relativePath: relPosix,
      absPath: abs,
      maxBytes: props.maxBytes,
    });
  }

  const diffResult = spawnSync(
    ['git', 'diff', '--no-ext-diff', '--no-color', 'HEAD', '--', relPosix],
    {
      cwd: props.workspaceRoot,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );

  if (diffResult.exitCode !== 0) {
    const stderr = Buffer.from(diffResult.stderr).toString('utf8').trim();

    return {
      type: 'error',
      text: stderr.length > 0 ? stderr : `Could not diff ${relPosix}.`,
    };
  }

  const patchText = Buffer.from(diffResult.stdout).toString('utf8');

  if (patchText.trim().length === 0) {
    return {
      type: 'error',
      text: `No git diff available for ${relPosix}.`,
    };
  }

  const truncatedPatch = truncateUtf8Text(patchText, props.maxBytes);

  return {
    type: 'ok',
    relativePath: relPosix,
    lines: parseDiffLines(truncatedPatch.text),
    truncated: truncatedPatch.truncated,
    binary: truncatedPatch.text.includes('Binary files '),
  };
}

export function handleTimelineDiffCommand(
  props: HandleDiffCommandProps,
): TimelineDiffResult {
  const resolved = resolveWorkspaceFilePath({
    workspaceRoot: props.workspaceRoot,
    relativePath: props.relativePath,
  });

  if ('type' in resolved) {
    return resolved;
  }

  const { abs, relPosix } = resolved;
  const exists = existsSync(abs);
  const isDirectory = exists ? statSync(abs).isDirectory() : false;

  const statusResult = spawnSync(
    ['git', 'status', '--porcelain=v1', '--', relPosix],
    {
      cwd: props.workspaceRoot,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );

  if (statusResult.exitCode !== 0) {
    return gitUnavailableError();
  }

  const statusText = Buffer.from(statusResult.stdout).toString('utf8').trim();

  if (isUntrackedStatus(statusText) && exists && !isDirectory) {
    const untrackedDiff = buildUntrackedDiff({
      relativePath: relPosix,
      absPath: abs,
      maxBytes: props.maxBytes,
    });

    if (untrackedDiff.type === 'ok') {
      return {
        type: 'ok',
        relativePath: relPosix,
        files: [fileDiffOkToAgentFileDiff(untrackedDiff)],
        truncated: untrackedDiff.truncated,
        commit: null,
        stagedFiles: listStagedFiles({
          workspaceRoot: props.workspaceRoot,
          pathspec: relPosix,
        }),
      };
    }
  }

  const diffResult = spawnSync(
    ['git', 'diff', '--no-ext-diff', '--no-color', 'HEAD', '--', relPosix],
    {
      cwd: props.workspaceRoot,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );

  if (diffResult.exitCode !== 0) {
    const stderr = Buffer.from(diffResult.stderr).toString('utf8').trim();

    return {
      type: 'error',
      text: stderr.length > 0 ? stderr : `Could not diff ${relPosix}.`,
    };
  }

  const patchText = Buffer.from(diffResult.stdout).toString('utf8');
  const truncatedPatch = truncateUtf8Text(patchText, props.maxBytes);
  const files = parseGitPatchFiles(truncatedPatch.text);

  for (const untrackedPath of listUntrackedFiles({
    workspaceRoot: props.workspaceRoot,
    relPosix,
  })) {
    const untrackedAbs = resolve(props.workspaceRoot, untrackedPath);

    if (existsSync(untrackedAbs) && !statSync(untrackedAbs).isDirectory()) {
      const file = untrackedDiffToTimelineFile(
        buildUntrackedDiff({
          relativePath: untrackedPath,
          absPath: untrackedAbs,
          maxBytes: props.maxBytes,
        }),
      );

      if (file !== null) {
        files.push(file);
      }
    }
  }

  if (files.length === 0) {
    return {
      type: 'error',
      text: `No git diff available for ${relPosix}${isDirectory ? '/' : ''}.`,
    };
  }

  return {
    type: 'ok',
    relativePath: relPosix,
    files,
    truncated: truncatedPatch.truncated,
    commit: null,
    stagedFiles: listStagedFiles({
      workspaceRoot: props.workspaceRoot,
      pathspec: relPosix,
    }),
  };
}

export function handleCommitTimelineDiffCommand(
  props: HandleCommitTimelineDiffCommandProps,
): TimelineDiffResult {
  if (!/^[0-9a-f]{7,40}$/i.test(props.commitHash)) {
    return { type: 'error', text: 'Invalid commit hash.' };
  }

  const resolved = resolveWorkspaceFilePath({
    workspaceRoot: props.workspaceRoot,
    relativePath: props.relativePath,
  });

  if ('type' in resolved) {
    return resolved;
  }

  const result = spawnSync(
    [
      'git',
      '--no-pager',
      'show',
      '--format=',
      '--no-ext-diff',
      '--no-color',
      '--find-renames',
      props.commitHash,
      '--',
      resolved.relPosix,
    ],
    {
      cwd: props.workspaceRoot,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );

  if (result.exitCode !== 0) {
    const stderr = Buffer.from(result.stderr).toString('utf8').trim();

    return {
      type: 'error',
      text: stderr.length > 0 ? stderr : 'Could not read commit diff.',
    };
  }

  const truncatedPatch = truncateUtf8Text(
    Buffer.from(result.stdout).toString('utf8'),
    props.maxBytes,
  );

  const files = parseGitPatchFiles(truncatedPatch.text);

  if (files.length === 0) {
    return {
      type: 'error',
      text: `No changes found for ${resolved.relPosix} in ${props.commitHash}.`,
    };
  }

  return {
    type: 'ok',
    relativePath: resolved.relPosix,
    files,
    truncated: truncatedPatch.truncated,
    commit: readCommitMetadata({
      workspaceRoot: props.workspaceRoot,
      commitHash: props.commitHash,
    }),
    stagedFiles: [],
  };
}

export function defaultDiffMaxBytes(): number {
  return DEFAULT_MAX_DIFF_BYTES;
}

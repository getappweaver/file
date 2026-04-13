import { existsSync, readFileSync, statSync } from 'fs';
import { relative, resolve } from 'path';

import { spawnSync } from 'bun';

const DEFAULT_MAX_DIFF_BYTES = 256 * 1024;

type FileDiffLineKind = 'header' | 'hunk' | 'add' | 'remove' | 'context';

export type FileDiffLine = {
  kind: FileDiffLineKind;
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
    relPosix: under.replace(/\\/g, '/'),
  };
}

function parseDiffLines(text: string): FileDiffLine[] {
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
      return { kind: 'header', text: line };
    }

    if (line.startsWith('@@')) {
      return { kind: 'hunk', text: line };
    }

    if (line.startsWith('+')) {
      return { kind: 'add', text: line };
    }

    if (line.startsWith('-')) {
      return { kind: 'remove', text: line };
    }

    return { kind: 'context', text: line };
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
      text: `diff --git a/${props.relativePath} b/${props.relativePath}`,
    },
    { kind: 'header' as const, text: 'new file mode 100644' },
    { kind: 'header' as const, text: '--- /dev/null' },
    { kind: 'header' as const, text: `+++ b/${props.relativePath}` },
    { kind: 'hunk' as const, text: `@@ -0,0 +1,${hunkSize} @@` },
    ...contentLines.map((line) => ({
      kind: 'add' as const,
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
    return {
      type: 'error',
      text: 'Git diff is unavailable for this workspace.',
    };
  }

  const statusText = Buffer.from(statusResult.stdout).toString('utf8').trim();
  const isUntracked = statusText.startsWith('?? ');

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

export function defaultDiffMaxBytes(): number {
  return DEFAULT_MAX_DIFF_BYTES;
}

// ---------------------------------------------------------------------------
// plugins/file/workspace-tree.ts — text tree of workspace (no DB)
// ---------------------------------------------------------------------------

import { readdirSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';

const IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.turbo',
  'bun.lock',
  '.DS_Store',
]);

const IGNORE_EXT = new Set(['.sqlite', '.sqlite-wal', '.sqlite-shm']);

export type ParsedTreeCliArgs = {
  maxDepth: number;
  targetDirRelative: string | null;
  extFilter: Set<string> | null;
};

export function parseTreeCliArgs(args: string[]): ParsedTreeCliArgs {
  let maxDepth = 0;
  let targetDirRelative: string | null = null;
  let extFilter: Set<string> | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ext' && args[i + 1]) {
      extFilter = new Set(
        args[i + 1].split(',').map((e) => (e.startsWith('.') ? e : `.${e}`)),
      );

      i++;
    } else if (!Number.isNaN(Number(args[i])) && args[i].trim() !== '') {
      maxDepth = parseInt(args[i], 10);
    } else {
      targetDirRelative = args[i];
    }
  }

  return { maxDepth, targetDirRelative, extFilter };
}

type AssertUnderWorkspaceRootProps = {
  workspaceRoot: string;
  targetDirRelative: string | null;
};

function resolveTreeTargetDir({
  workspaceRoot,
  targetDirRelative,
}: AssertUnderWorkspaceRootProps): string {
  const rootR = resolve(workspaceRoot);
  const targetR = resolve(workspaceRoot, targetDirRelative ?? '.');

  const rel = relative(rootR, targetR);

  if (rel.startsWith('..') || rel === '..') {
    throw new Error('Path escapes workspace');
  }

  if (!statSync(targetR).isDirectory()) {
    throw new Error(`Not a directory: ${targetDirRelative ?? '.'}`);
  }

  return targetR;
}

function shouldIgnore(name: string): boolean {
  if (IGNORE.has(name)) {
    return true;
  }

  const ext = name.slice(name.lastIndexOf('.'));

  return IGNORE_EXT.has(ext);
}

function collectTreeLines(props: {
  dir: string;
  prefix: string;
  depth: number;
  maxDepth: number;
  extFilter: Set<string> | null;
  lines: string[];
}): void {
  const { dir, prefix, depth, maxDepth, extFilter, lines } = props;

  if (depth > maxDepth) {
    return;
  }

  const entries = readdirSync(dir)
    .filter((e) => {
      if (shouldIgnore(e)) {
        return false;
      }

      const fullPath = join(dir, e);
      const isDir = statSync(fullPath).isDirectory();

      if (!isDir && extFilter) {
        const ext = e.slice(e.lastIndexOf('.'));

        return extFilter.has(ext);
      }

      return true;
    })
    .sort((a, b) => {
      const aIsDir = statSync(join(dir, a)).isDirectory();
      const bIsDir = statSync(join(dir, b)).isDirectory();

      if (aIsDir && !bIsDir) {
        return -1;
      }

      if (!aIsDir && bIsDir) {
        return 1;
      }

      return a.localeCompare(b);
    });

  entries.forEach((entry, i) => {
    const isLast = i === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';
    const fullPath = join(dir, entry);
    const isDir = statSync(fullPath).isDirectory();

    lines.push(`${prefix}${connector}${entry}${isDir ? '/' : ''}`);

    if (isDir) {
      collectTreeLines({
        dir: fullPath,
        prefix: prefix + childPrefix,
        depth: depth + 1,
        maxDepth,
        extFilter,
        lines,
      });
    }
  });
}

export type BuildWorkspaceTreeProps = {
  workspaceRoot: string;
  targetDirRelative: string | null;
  maxDepth: number;
  extFilter: Set<string> | null;
};

export function buildWorkspaceTree({
  workspaceRoot,
  targetDirRelative,
  maxDepth,
  extFilter,
}: BuildWorkspaceTreeProps): string {
  const targetDir = resolveTreeTargetDir({ workspaceRoot, targetDirRelative });
  const lines: string[] = [targetDir];

  collectTreeLines({
    dir: targetDir,
    prefix: '',
    depth: 0,
    maxDepth,
    extFilter,
    lines,
  });

  return lines.join('\n');
}

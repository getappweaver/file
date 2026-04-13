// ---------------------------------------------------------------------------
// plugins/file/workspace-tree.ts — text tree of workspace (no DB)
// ---------------------------------------------------------------------------

import { readdirSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';

import {
  collectWorkspaceGitStatusDecorations,
  type WorkspaceGitStatusDecoration,
} from './git-status';

export type { WorkspaceGitStatusDecoration } from './git-status';

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
  /** True when the user passed a numeric depth token (so `tree 0` stays flat on web). */
  maxDepthExplicit: boolean;
  targetDirRelative: string | null;
  extFilter: Set<string> | null;
};

export function parseTreeCliArgs(args: string[]): ParsedTreeCliArgs {
  let maxDepth = 0;
  let maxDepthExplicit = false;
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
      maxDepthExplicit = true;
    } else {
      targetDirRelative = args[i];
    }
  }

  return { maxDepth, maxDepthExplicit, targetDirRelative, extFilter };
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

export type WorkspaceDirEntry = {
  name: string;
  /** Relative path from workspace root using forward slashes. */
  relativePosix: string;
  isDirectory: boolean;
};

/** One row in the web file tree (same depth semantics as `buildWorkspaceTree` `maxDepth`). */
export type WorkspaceTreeListRow = {
  name: string;
  relativePosix: string;
  isDirectory: boolean;
  git: WorkspaceGitStatusDecoration | null;
  /** Spaces and `│` segments before the `├──` / `└──` connector. */
  treePrefix: string;
  connector: '├── ' | '└── ';
};

export type ListWorkspaceDirectoryResult =
  | { type: 'ok'; rows: WorkspaceTreeListRow[]; displayPath: string }
  | { type: 'error'; text: string };

type CollectTreeRowsProps = {
  workspaceRoot: string;
  dirAbs: string;
  treePrefix: string;
  depth: number;
  maxDepth: number;
  extFilter: Set<string> | null;
  rows: WorkspaceTreeListRow[];
};

function collectWorkspaceTreeRows(props: CollectTreeRowsProps): void {
  const {
    workspaceRoot,
    dirAbs,
    treePrefix,
    depth,
    maxDepth,
    extFilter,
    rows,
  } = props;

  if (depth > maxDepth) {
    return;
  }

  const names = readdirSync(dirAbs)
    .filter((e) => !shouldIgnore(e))
    .sort((a, b) => {
      const pa = join(dirAbs, a);
      const pb = join(dirAbs, b);
      const da = statSync(pa).isDirectory();
      const db = statSync(pb).isDirectory();

      if (da !== db) {
        return da ? -1 : 1;
      }

      return a.localeCompare(b);
    });

  names.forEach((name, i) => {
    const full = join(dirAbs, name);
    const st = statSync(full);
    const isDir = st.isDirectory();
    const relPosix = relative(workspaceRoot, full).replace(/\\/g, '/');

    if (!isDir && extFilter !== null) {
      const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';

      if (!extFilter.has(ext)) {
        return;
      }
    }

    const isLast = i === names.length - 1;
    const connector: '├── ' | '└── ' = isLast ? '└── ' : '├── ';

    rows.push({
      name,
      relativePosix: relPosix,
      isDirectory: isDir,
      git: null,
      treePrefix,
      connector,
    });

    if (isDir) {
      const childPrefix = isLast ? '    ' : '│   ';

      collectWorkspaceTreeRows({
        workspaceRoot,
        dirAbs: full,
        treePrefix: treePrefix + childPrefix,
        depth: depth + 1,
        maxDepth,
        extFilter,
        rows,
      });
    }
  });
}

type ListWorkspaceDirectoryEntriesProps = {
  workspaceRoot: string;
  targetDirRelative: string | null;
  extFilter: Set<string> | null;
  /**
   * Same as CLI/text `buildWorkspaceTree` maxDepth: `0` = only this directory;
   * `1` = include immediate children of subfolders, etc.
   */
  maxDepth: number;
};

export function listWorkspaceDirectoryEntries(
  props: ListWorkspaceDirectoryEntriesProps,
): ListWorkspaceDirectoryResult {
  try {
    const dirAbs = resolveTreeTargetDir({
      workspaceRoot: props.workspaceRoot,
      targetDirRelative: props.targetDirRelative,
    });

    const displayPath =
      relative(props.workspaceRoot, dirAbs).replace(/\\/g, '/') || '.';

    const rows: WorkspaceTreeListRow[] = [];

    collectWorkspaceTreeRows({
      workspaceRoot: props.workspaceRoot,
      dirAbs,
      treePrefix: '',
      depth: 0,
      maxDepth: props.maxDepth,
      extFilter: props.extFilter,
      rows,
    });

    const gitDecorations = collectWorkspaceGitStatusDecorations(
      props.workspaceRoot,
    );

    rows.forEach((row) => {
      row.git = gitDecorations.get(row.relativePosix) ?? null;
    });

    return { type: 'ok', rows, displayPath };
  } catch (err) {
    return {
      type: 'error',
      text: String(err instanceof Error ? err.message : err),
    };
  }
}

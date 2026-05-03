// ---------------------------------------------------------------------------
// plugins/file/workspace-tree.ts — text tree of workspace (no DB)
// ---------------------------------------------------------------------------

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
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

type IgnoreRule = {
  baseDirAbs: string;
  regex: RegExp;
  directoryOnly: boolean;
};

export type ParsedTreeCliArgs = {
  maxDepth: number;
  /** True when the user passed a numeric depth token (so `tree 0` stays flat on web). */
  maxDepthExplicit: boolean;
  targetDirRelative: string | null;
  extFilter: Set<string> | null;
  expandedPaths: Set<string>;
};

function parseExpandedPaths(raw: string): Set<string> {
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));

    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(
      parsed
        .filter((value): value is string => typeof value === 'string')
        .filter((value) => value.length > 0),
    );
  } catch {
    return new Set();
  }
}

export function parseTreeCliArgs(args: string[]): ParsedTreeCliArgs {
  let maxDepth = 0;
  let maxDepthExplicit = false;
  let targetDirRelative: string | null = null;
  let extFilter: Set<string> | null = null;
  let expandedPaths = new Set<string>();

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ext' && args[i + 1]) {
      extFilter = new Set(
        args[i + 1].split(',').map((e) => (e.startsWith('.') ? e : `.${e}`)),
      );

      i++;
    } else if (args[i] === '--expanded' && args[i + 1]) {
      expandedPaths = parseExpandedPaths(args[i + 1]);

      i++;
    } else if (!Number.isNaN(Number(args[i])) && args[i].trim() !== '') {
      maxDepth = parseInt(args[i], 10);
      maxDepthExplicit = true;
    } else {
      targetDirRelative = args[i];
    }
  }

  return {
    maxDepth,
    maxDepthExplicit,
    targetDirRelative,
    extFilter,
    expandedPaths,
  };
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

function escapeRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function compileGitignorePattern(pattern: string): RegExp {
  const normalized = pattern.startsWith('/') ? pattern.slice(1) : pattern;

  const escaped = normalized
    .replace(/\*\*/g, '::DOUBLE_STAR::')
    .replace(/\*/g, '::STAR::')
    .split('/')
    .map((part) => escapeRegex(part))
    .join('/')
    .replace(/::DOUBLE_STAR::/g, '.*')
    .replace(/::STAR::/g, '[^/]*');

  return pattern.includes('/')
    ? new RegExp(`^${escaped}(?:/.*)?$`)
    : new RegExp(`^(?:${escaped}|.*/${escaped})(?:/.*)?$`);
}

function gitignoreRulesForDir(props: {
  dirAbs: string;
  workspaceRoot: string;
}): IgnoreRule[] {
  const gitignorePath = join(props.dirAbs, '.gitignore');

  if (!existsSync(gitignorePath)) {
    return [];
  }

  const isWorkspaceRoot =
    resolve(props.dirAbs) === resolve(props.workspaceRoot);

  return readFileSync(gitignorePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .filter((line) => !line.startsWith('!'))
    .filter((line) => !(isWorkspaceRoot && line === 'plugins/'))
    .map((line) => {
      const directoryOnly = line.endsWith('/');
      const pattern = directoryOnly ? line.slice(0, -1) : line;

      return {
        baseDirAbs: props.dirAbs,
        regex: compileGitignorePattern(pattern),
        directoryOnly,
      };
    });
}

function isIgnoredByGitignoreRules(props: {
  fullPath: string;
  isDirectory: boolean;
  rules: IgnoreRule[];
}): boolean {
  return props.rules.some((rule) => {
    if (rule.directoryOnly && !props.isDirectory) {
      return false;
    }

    const rel = relative(rule.baseDirAbs, props.fullPath).replace(/\\/g, '/');

    return rel.length > 0 && rule.regex.test(rel);
  });
}

function collectTreeLines(props: {
  workspaceRoot: string;
  dir: string;
  prefix: string;
  depth: number;
  maxDepth: number;
  extFilter: Set<string> | null;
  gitignoreRules: IgnoreRule[];
  lines: string[];
}): void {
  const { workspaceRoot, dir, prefix, depth, maxDepth, extFilter, lines } =
    props;

  if (depth > maxDepth) {
    return;
  }

  const gitignoreRules = [
    ...props.gitignoreRules,
    ...gitignoreRulesForDir({ dirAbs: dir, workspaceRoot }),
  ];

  const entries = readdirSync(dir)
    .filter((e) => {
      if (shouldIgnore(e)) {
        return false;
      }

      const fullPath = join(dir, e);
      const isDir = statSync(fullPath).isDirectory();

      if (
        isIgnoredByGitignoreRules({
          fullPath,
          isDirectory: isDir,
          rules: gitignoreRules,
        })
      ) {
        return false;
      }

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
        workspaceRoot,
        dir: fullPath,
        prefix: prefix + childPrefix,
        depth: depth + 1,
        maxDepth,
        extFilter,
        gitignoreRules,
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
    workspaceRoot,
    dir: targetDir,
    prefix: '',
    depth: 0,
    maxDepth,
    extFilter,
    gitignoreRules: [],
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
  hasChildren: boolean;
  loaded: boolean;
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
  expandedPaths: Set<string>;
  gitignoreRules: IgnoreRule[];
  rows: WorkspaceTreeListRow[];
};

function listVisibleTreeEntryNames(
  dirAbs: string,
  extFilter: Set<string> | null,
  gitignoreRules: IgnoreRule[],
): string[] {
  return readdirSync(dirAbs)
    .filter((e) => {
      if (shouldIgnore(e)) {
        return false;
      }

      const fullPath = join(dirAbs, e);
      const isDir = statSync(fullPath).isDirectory();

      if (
        isIgnoredByGitignoreRules({
          fullPath,
          isDirectory: isDir,
          rules: gitignoreRules,
        })
      ) {
        return false;
      }

      if (!isDir && extFilter !== null) {
        const ext = e.includes('.') ? e.slice(e.lastIndexOf('.')) : '';

        return extFilter.has(ext);
      }

      return true;
    })
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
}

function collectWorkspaceTreeRows(props: CollectTreeRowsProps): void {
  const {
    workspaceRoot,
    dirAbs,
    treePrefix,
    depth,
    maxDepth,
    extFilter,
    expandedPaths,
    gitignoreRules,
    rows,
  } = props;

  const nextGitignoreRules = [
    ...gitignoreRules,
    ...gitignoreRulesForDir({ dirAbs, workspaceRoot }),
  ];

  const names = listVisibleTreeEntryNames(
    dirAbs,
    extFilter,
    nextGitignoreRules,
  );

  names.forEach((name, i) => {
    const full = join(dirAbs, name);
    const st = statSync(full);
    const isDir = st.isDirectory();
    const relPosix = relative(workspaceRoot, full).replace(/\\/g, '/');

    const isLast = i === names.length - 1;
    const connector: '├── ' | '└── ' = isLast ? '└── ' : '├── ';

    const hasChildren = isDir
      ? listVisibleTreeEntryNames(full, extFilter, nextGitignoreRules).length >
        0
      : false;

    const loaded = isDir && (depth < maxDepth || expandedPaths.has(relPosix));

    rows.push({
      name,
      relativePosix: relPosix,
      isDirectory: isDir,
      hasChildren,
      loaded,
      git: null,
      treePrefix,
      connector,
    });

    if (loaded) {
      const childPrefix = isLast ? '    ' : '│   ';

      collectWorkspaceTreeRows({
        workspaceRoot,
        dirAbs: full,
        treePrefix: treePrefix + childPrefix,
        depth: depth + 1,
        maxDepth,
        extFilter,
        expandedPaths,
        gitignoreRules: nextGitignoreRules,
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
  expandedPaths: Set<string>;
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
      expandedPaths: props.expandedPaths,
      gitignoreRules: [],
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

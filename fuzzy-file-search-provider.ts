import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';

import { FuzzyFileSearchV1 } from '@src/capabilities/fuzzy-file-search.v1';
import { defineCapabilityProvider } from '@src/capabilities/types';

import { resolveFileWorkspaceRoot } from './commands/shared/workspace-root';

// Reuse ignore semantics from workspace-tree.ts so composer picker matches file widget.
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

type IgnoreRule = {
  baseDirAbs: string;
  regex: RegExp;
  directoryOnly: boolean;
};

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

function shouldIgnore(name: string): boolean {
  if (IGNORE.has(name)) {
    return true;
  }

  const ext = name.slice(name.lastIndexOf('.'));

  return IGNORE_EXT.has(ext);
}

function collectAllFiles(props: {
  workspaceRoot: string;
  dirAbs: string;
  gitignoreRules: IgnoreRule[];
  includeDirectories: boolean;
  includeIgnored: boolean;
  ignoreDotFiles: boolean;
  out: string[];
}): void {
  const nextRules = props.includeIgnored
    ? []
    : [
        ...props.gitignoreRules,
        ...gitignoreRulesForDir({
          dirAbs: props.dirAbs,
          workspaceRoot: props.workspaceRoot,
        }),
      ];

  let entries: string[];

  try {
    entries = readdirSync(props.dirAbs);
  } catch {
    return;
  }

  for (const name of entries) {
    if (props.ignoreDotFiles && name.startsWith('.')) {
      continue;
    }

    if (!props.includeIgnored && shouldIgnore(name)) {
      continue;
    }

    const fullPath = join(props.dirAbs, name);

    let st: ReturnType<typeof statSync> | null = null;

    try {
      st = statSync(fullPath);
    } catch {
      continue;
    }

    const isDir = st.isDirectory();

    if (
      !props.includeIgnored &&
      isIgnoredByGitignoreRules({
        fullPath,
        isDirectory: isDir,
        rules: nextRules,
      })
    ) {
      continue;
    }

    const relPosix = relative(props.workspaceRoot, fullPath).replace(
      /\\/g,
      '/',
    );

    if (isDir) {
      if (props.includeDirectories) {
        props.out.push(`${relPosix}/`);
      } else {
        collectAllFiles({
          workspaceRoot: props.workspaceRoot,
          dirAbs: fullPath,
          gitignoreRules: nextRules,
          includeDirectories: false,
          includeIgnored: props.includeIgnored,
          ignoreDotFiles: props.ignoreDotFiles,
          out: props.out,
        });
      }
    } else {
      props.out.push(relPosix);
    }
  }
}

function isSubsequence(haystack: string, needle: string): boolean {
  let hi = 0;
  let ni = 0;

  while (hi < haystack.length && ni < needle.length) {
    if (haystack[hi] === needle[ni]) {
      ni++;
    }

    hi++;
  }

  return ni === needle.length;
}

function fuzzyScore(pathLower: string, queryLower: string): number {
  if (queryLower.length === 0) {
    return 0;
  }

  if (pathLower === queryLower) {
    return 100;
  }

  const idx = pathLower.indexOf(queryLower);

  if (idx !== -1) {
    const basename = pathLower.slice(pathLower.lastIndexOf('/') + 1);
    const isBasenameMatch = basename.includes(queryLower);
    const basenameBonus = isBasenameMatch ? 10 : 0;

    return (
      80 +
      basenameBonus -
      idx * 0.5 -
      (pathLower.length - queryLower.length) * 0.05
    );
  }

  if (isSubsequence(pathLower, queryLower)) {
    return 25 - pathLower.length * 0.02;
  }

  const basename = pathLower.slice(pathLower.lastIndexOf('/') + 1);

  if (isSubsequence(basename, queryLower)) {
    return 15 - basename.length * 0.02;
  }

  return -1;
}

function findScopedDir(props: { query: string; workspaceRoot: string }): {
  scopedDir: string | null;
  remainingQuery: string;
} {
  const trimmed = props.query.trim();

  if (!trimmed.includes('/')) {
    return { scopedDir: null, remainingQuery: trimmed };
  }

  // Find longest directory prefix that exists on disk.
  // e.g. "src/components/App" => try "src/components", then "src"
  const parts = trimmed.split('/');
  // Exclude trailing part after last '/' (the actual search term) – but if query ends with '/', remaining is empty and prefix is entire trimmed without trailing slash
  const endsWithSlash = trimmed.endsWith('/');
  const dirPartsCount = endsWithSlash ? parts.length - 1 : parts.length - 1;

  for (let len = dirPartsCount; len >= 1; len--) {
    const candidate = parts.slice(0, len).join('/');
    const candidateAbs = resolve(props.workspaceRoot, candidate);

    try {
      const st = statSync(candidateAbs);

      if (st.isDirectory()) {
        const remaining = endsWithSlash ? '' : parts.slice(len).join('/');

        return { scopedDir: candidate, remainingQuery: remaining };
      }
    } catch {
      // not a directory, continue
    }
  }

  return { scopedDir: null, remainingQuery: trimmed };
}

export const fuzzyFileSearchProvider = defineCapabilityProvider({
  contract: FuzzyFileSearchV1,
  operations: {
    [FuzzyFileSearchV1.operations.search.id]: async ({ input }) => {
      const rawQuery = input.query ?? '';
      const includeDirectories = input.includeDirectories ?? false;
      const includeIgnored = input.includeIgnored ?? false;
      const ignoreDotFiles = input.ignoreDotFiles ?? true;
      const isRegex = input.isRegex ?? false;
      const limit = input.limit;

      const boundedLimit =
        limit == null ? null : Math.max(1, Math.min(50, limit));

      const workspaceRoot = resolveFileWorkspaceRoot();
      let effectiveQuery = rawQuery.trim();
      let scopedDir: string | null = null;

      // If exact folder match exists, scope collection to that folder.
      // Only apply for non-regex queries; regex queries are already fully expressed.
      if (!isRegex && effectiveQuery.length > 0) {
        const scoped = findScopedDir({ query: effectiveQuery, workspaceRoot });

        if (scoped.scopedDir !== null) {
          scopedDir = scoped.scopedDir;
          effectiveQuery = scoped.remainingQuery;
        }
      }

      const collectRoot =
        scopedDir === null ? workspaceRoot : resolve(workspaceRoot, scopedDir);

      const result = (files: string[], truncated: boolean) => ({
        files,
        truncated,
        currentDirectory: collectRoot,
        relativeDirectory: relative(workspaceRoot, collectRoot).replace(
          /\\/g,
          '/',
        ),
      });

      if (scopedDir !== null) {
        try {
          const st = statSync(collectRoot);

          if (!st.isDirectory()) {
            return result([], false);
          }
        } catch {
          return result([], false);
        }
      }

      const out: string[] = [];

      collectAllFiles({
        workspaceRoot,
        dirAbs: collectRoot,
        gitignoreRules: [],
        includeDirectories,
        includeIgnored,
        ignoreDotFiles,
        out,
      });

      if (out.length === 0) {
        return result([], false);
      }

      const queryForMatch = effectiveQuery.trim().toLowerCase();

      // Empty (or scoped with trailing slash) => list all under scope
      if (queryForMatch.length === 0) {
        out.sort((a, b) => {
          const directoryOrder =
            Number(b.endsWith('/')) - Number(a.endsWith('/'));

          return directoryOrder || a.localeCompare(b);
        });

        if (boundedLimit == null) {
          return result(out, false);
        }

        const truncated = out.length > boundedLimit;

        return result(truncated ? out.slice(0, boundedLimit) : out, truncated);
      }

      // Regex mode: composer transforms glob -> regex and passes isRegex=true
      if (isRegex) {
        let regex: RegExp;

        try {
          regex = new RegExp(effectiveQuery, 'i');
        } catch {
          return result([], false);
        }

        const matched = out.filter((p) => {
          // Mirror tree-filter glob handling: if pattern contains '/', test path, else basename
          const queryHasSlash = effectiveQuery.includes('/');
          const target = queryHasSlash ? p : p.slice(p.lastIndexOf('/') + 1);

          return regex.test(target) || regex.test(p);
        });

        matched.sort((a, b) => {
          const directoryOrder =
            Number(b.endsWith('/')) - Number(a.endsWith('/'));

          return directoryOrder || a.localeCompare(b);
        });

        if (boundedLimit == null) {
          return result(matched, false);
        }

        const truncated = matched.length > boundedLimit;

        return result(
          truncated ? matched.slice(0, boundedLimit) : matched,
          truncated,
        );
      }

      // Fuzzy substring / subsequence scoring
      type Scored = {
        path: string;
        score: number;
      };

      const scored: Scored[] = [];

      for (const p of out) {
        // For scoped search, the candidate list is already limited to that folder,
        // so scoring against the full path still prefers files under it.
        // Also score against basename for better relevance.
        const score = fuzzyScore(p.toLowerCase(), queryForMatch);

        if (score >= 0) {
          scored.push({ path: p, score });
        }
      }

      scored.sort((a, b) => {
        const directoryOrder =
          Number(b.path.endsWith('/')) - Number(a.path.endsWith('/'));

        if (directoryOrder !== 0) {
          return directoryOrder;
        }

        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.path.localeCompare(b.path);
      });

      const files = scored.map((s) => s.path);

      if (boundedLimit == null) {
        return result(files, false);
      }

      const truncated = files.length > boundedLimit;

      return result(
        truncated ? files.slice(0, boundedLimit) : files,
        truncated,
      );
    },
  },
});

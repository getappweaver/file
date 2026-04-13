import { createHash } from 'crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';

import type { DirectoryEntry } from './types';
import { BOTTOMUP_FILE } from './types';

const HIDDEN_FILE_ALLOWLIST = new Set([
  '.editorconfig',
  '.gitignore',
  '.prettierignore',
  '.prettierrc',
  '.cursorignore',
  '.npmrc',
  '.nvmrc',
  '.tool-versions',
  '.env.example',
]);

export function toPosix(value: string): string {
  return value.replace(/\\/g, '/');
}

export function resolveWorkingDirectory(
  workspaceRoot: string,
  workingDir: string | null,
): { absolutePath: string; relativePosix: string } {
  const rootResolved = resolve(workspaceRoot);
  const targetResolved = resolve(rootResolved, workingDir ?? '.');
  const rel = relative(rootResolved, targetResolved);

  if (rel === '..' || rel.startsWith('../') || rel.startsWith('..\\')) {
    throw new Error('Working directory escapes workspace root.');
  }

  if (!existsSync(targetResolved) || !statSync(targetResolved).isDirectory()) {
    throw new Error(
      `Working directory is not a directory: ${workingDir ?? '.'}`,
    );
  }

  return {
    absolutePath: targetResolved,
    relativePosix: toPosix(rel) || '.',
  };
}

export function fileHasScopeRootMarker(filePath: string): boolean {
  if (!existsSync(filePath)) {
    return false;
  }

  const raw = readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!match?.[1]) {
    return false;
  }

  return /^scope_root:\s*true\s*$/m.test(match[1]);
}

export function detectScopeRoot(
  workspaceRoot: string,
  workingDirAbsolute: string,
): { absolutePath: string; relativePosix: string } {
  let cursor = workingDirAbsolute;
  const resolvedWorkspaceRoot = resolve(workspaceRoot);

  while (true) {
    if (fileHasScopeRootMarker(join(cursor, BOTTOMUP_FILE))) {
      return {
        absolutePath: cursor,
        relativePosix: toPosix(relative(resolvedWorkspaceRoot, cursor)) || '.',
      };
    }

    if (cursor === resolvedWorkspaceRoot) {
      return { absolutePath: resolvedWorkspaceRoot, relativePosix: '.' };
    }

    const parent = dirname(cursor);

    if (parent === cursor) {
      return { absolutePath: resolvedWorkspaceRoot, relativePosix: '.' };
    }

    cursor = parent;
  }
}

export function resolveScopeRoot(params: {
  workspaceRoot: string;
  scopeRoot: string | null;
  workingDirAbsolute: string;
  workingDirRelative: string;
}): { absolutePath: string; relativePosix: string } {
  if (params.scopeRoot === null) {
    return detectScopeRoot(params.workspaceRoot, params.workingDirAbsolute);
  }

  const resolved = resolveWorkingDirectory(
    params.workspaceRoot,
    params.scopeRoot,
  );

  const relFromScope = relative(
    resolved.absolutePath,
    params.workingDirAbsolute,
  );

  if (
    relFromScope === '..' ||
    relFromScope.startsWith('../') ||
    relFromScope.startsWith('..\\')
  ) {
    throw new Error(
      `Working directory ${params.workingDirRelative} is outside scope root ${resolved.relativePosix}.`,
    );
  }

  return resolved;
}

function compileIgnorePattern(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
    .replace(/\*\*/g, '::DOUBLE_STAR::')
    .replace(/\*/g, '[^/]*')
    .replace(/::DOUBLE_STAR::/g, '.*');

  return new RegExp(`^(?:${escaped}|.*/${escaped})$`);
}

export class IgnoreFilter {
  private readonly gitIgnoreCache = new Map<string, boolean>();
  private readonly gitTrackedCache = new Map<string, boolean>();
  private readonly extraIgnoreRegexes: RegExp[];

  constructor(
    private readonly workspaceRoot: string,
    private readonly respectGitignore: boolean,
    private readonly excludeHidden: boolean,
    extraIgnore: string[],
    private readonly forcedIncludePrefix: string | null,
  ) {
    this.extraIgnoreRegexes = extraIgnore.map((pattern) =>
      compileIgnorePattern(pattern),
    );
  }

  shouldIgnore(entry: DirectoryEntry): boolean {
    if (entry.name === '.git') {
      return true;
    }

    if (this.excludeHidden && entry.name.startsWith('.')) {
      if (entry.isDirectory) {
        return true;
      }

      if (!HIDDEN_FILE_ALLOWLIST.has(entry.name)) {
        return true;
      }
    }

    if (entry.name === BOTTOMUP_FILE) {
      return true;
    }

    if (
      this.extraIgnoreRegexes.some((regex) => regex.test(entry.relativePosix))
    ) {
      return true;
    }

    if (
      this.forcedIncludePrefix !== null &&
      (entry.relativePosix === this.forcedIncludePrefix ||
        entry.relativePosix.startsWith(`${this.forcedIncludePrefix}/`))
    ) {
      return false;
    }

    if (!this.respectGitignore) {
      return false;
    }

    const cached = this.gitIgnoreCache.get(entry.relativePosix);

    if (cached !== undefined) {
      return cached;
    }

    const proc = Bun.spawnSync({
      cmd: ['git', 'check-ignore', '--quiet', '--', entry.relativePosix],
      cwd: this.workspaceRoot,
      stdout: 'ignore',
      stderr: 'ignore',
    });

    const ignored = proc.exitCode === 0 && !this.isTracked(entry.relativePosix);
    this.gitIgnoreCache.set(entry.relativePosix, ignored);

    return ignored;
  }

  private isTracked(relativePosix: string): boolean {
    const cached = this.gitTrackedCache.get(relativePosix);

    if (cached !== undefined) {
      return cached;
    }

    const proc = Bun.spawnSync({
      cmd: ['git', 'ls-files', '--error-unmatch', '--', relativePosix],
      cwd: this.workspaceRoot,
      stdout: 'ignore',
      stderr: 'ignore',
    });

    const tracked = proc.exitCode === 0;
    this.gitTrackedCache.set(relativePosix, tracked);

    return tracked;
  }
}

export function listDirectoryEntries(
  workspaceRoot: string,
  directoryPath: string,
  filter: IgnoreFilter,
): { files: DirectoryEntry[]; directories: DirectoryEntry[] } {
  const files: DirectoryEntry[] = [];
  const directories: DirectoryEntry[] = [];

  for (const name of readdirSync(directoryPath).sort((a, b) =>
    a.localeCompare(b),
  )) {
    const absolutePath = join(directoryPath, name);
    const stats = statSync(absolutePath);
    const relativePosix = toPosix(relative(workspaceRoot, absolutePath));

    const entry: DirectoryEntry = {
      name,
      absolutePath,
      relativePosix,
      isDirectory: stats.isDirectory(),
    };

    if (filter.shouldIgnore(entry)) {
      continue;
    }

    if (entry.isDirectory) {
      directories.push(entry);
    } else {
      files.push(entry);
    }
  }

  return { files, directories };
}

export function trimText(value: string, maxLength: number): string {
  const clean = value.replace(/\r\n/g, '\n').trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength - 1).trimEnd()}...`;
}

export function readFileSnippet(
  entry: DirectoryEntry,
  maxFileBytes: number | null,
) {
  const buffer = readFileSync(entry.absolutePath);
  const effectiveMax = maxFileBytes ?? buffer.length;
  const clipped = buffer.subarray(0, Math.min(buffer.length, effectiveMax));

  if (clipped.includes(0)) {
    return {
      name: entry.name,
      relativePosix: entry.relativePosix,
      sizeBytes: buffer.length,
      snippet: null,
      skippedReason: 'binary or null-byte content',
    };
  }

  const text = Buffer.from(clipped).toString('utf8');

  return {
    name: entry.name,
    relativePosix: entry.relativePosix,
    sizeBytes: buffer.length,
    snippet: trimText(text, effectiveMax),
    skippedReason:
      buffer.length > effectiveMax
        ? `truncated to ${effectiveMax} bytes`
        : null,
  };
}

export function sha256Hex(input: string | Uint8Array): string {
  return createHash('sha256').update(input).digest('hex');
}

export function hashObject(value: unknown): string {
  return sha256Hex(JSON.stringify(value));
}

export function readBottomupFile(path: string): string | null {
  if (!existsSync(path)) {
    return null;
  }

  return readFileSync(path, 'utf8').trim() || null;
}

export function listChildBottomupStatus(params: {
  workspaceRoot: string;
  directoryPath: string;
  relativePosix: string;
  depth: number;
  filter: IgnoreFilter;
  indent: string;
}): string[] {
  if (params.depth <= 0) {
    return [];
  }

  const { directories } = listDirectoryEntries(
    params.workspaceRoot,
    params.directoryPath,
    params.filter,
  );

  const lines: string[] = [];

  for (const directory of directories) {
    const docPath = join(directory.absolutePath, BOTTOMUP_FILE);

    lines.push(
      `${params.indent}- ${directory.relativePosix}/ (${existsSync(docPath) ? 'has' : 'missing'} ${BOTTOMUP_FILE})`,
    );

    lines.push(
      ...listChildBottomupStatus({
        workspaceRoot: params.workspaceRoot,
        directoryPath: directory.absolutePath,
        relativePosix: directory.relativePosix,
        depth: params.depth - 1,
        filter: params.filter,
        indent: `${params.indent}  `,
      }),
    );
  }

  return lines;
}

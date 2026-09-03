import { createHash } from 'crypto';
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'fs';
import { dirname, join, relative, resolve } from 'path';

import { IgnoreFilter, type FilterEntry } from '../shared/ignore-filter';

import {
  BOTTOMUP_INDEX_FILE,
  BottomupIndexSchema,
  type BottomupIndex,
} from './types';

export type GenerateEntry = {
  name: string;
  absolutePath: string;
  relativePath: string;
  isDirectory: boolean;
};

export function toPosix(value: string): string {
  return value.replace(/\\/g, '/');
}

export function workspaceRelative(
  workspaceRoot: string,
  absolutePath: string,
): string {
  return (
    toPosix(relative(resolve(workspaceRoot), resolve(absolutePath))) || '.'
  );
}

export function resolveDirectory(
  workspaceRoot: string,
  inputPath: string,
): { absolutePath: string; relativePath: string } {
  const root = resolve(workspaceRoot);
  const absolutePath = resolve(root, inputPath);
  const relativePath = relative(root, absolutePath);

  if (
    relativePath === '..' ||
    relativePath.startsWith('../') ||
    relativePath.startsWith('..\\')
  ) {
    throw new Error(`Path escapes workspace: ${inputPath}`);
  }

  if (!existsSync(absolutePath) || !statSync(absolutePath).isDirectory()) {
    throw new Error(`Path is not a directory: ${inputPath}`);
  }

  const realRoot = realpathSync(root);
  const realTarget = realpathSync(absolutePath);
  const realRelative = relative(realRoot, realTarget);

  if (
    realRelative === '..' ||
    realRelative.startsWith('../') ||
    realRelative.startsWith('..\\')
  ) {
    throw new Error(`Path resolves outside workspace: ${inputPath}`);
  }

  return {
    absolutePath,
    relativePath: toPosix(relativePath) || '.',
  };
}

export function readIndex(directoryPath: string): BottomupIndex | null {
  const filePath = join(directoryPath, BOTTOMUP_INDEX_FILE);

  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return BottomupIndexSchema.parse(
      JSON.parse(readFileSync(filePath, 'utf8')) as unknown,
    );
  } catch {
    return null;
  }
}

export function hashText(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hashValue(value: unknown): string {
  return hashText(JSON.stringify(value));
}

export function serializeIndex(index: BottomupIndex): string {
  return `${JSON.stringify(index, null, 2)}\n`;
}

export function writeIndex(directoryPath: string, serialized: string): void {
  const filePath = join(directoryPath, BOTTOMUP_INDEX_FILE);
  const temporaryPath = `${filePath}.tmp-${process.pid}`;

  writeFileSync(temporaryPath, serialized, 'utf8');
  renameSync(temporaryPath, filePath);
}

export function resolveGenerateRoot(params: {
  workspaceRoot: string;
  targetAbsolute: string;
  explicitRoot: string | null;
}): {
  absolutePath: string;
  relativePath: string;
  source: 'explicit' | 'nearest marked ancestor' | 'workspace fallback';
} {
  const workspaceRoot = resolve(params.workspaceRoot);

  if (params.explicitRoot !== null) {
    const root = resolveDirectory(workspaceRoot, params.explicitRoot);
    const fromRoot = relative(root.absolutePath, params.targetAbsolute);

    if (
      fromRoot === '..' ||
      fromRoot.startsWith('../') ||
      fromRoot.startsWith('..\\')
    ) {
      throw new Error(
        `Path ${workspaceRelative(workspaceRoot, params.targetAbsolute)} is outside root ${root.relativePath}.`,
      );
    }

    return { ...root, source: 'explicit' };
  }

  let cursor = params.targetAbsolute;

  while (true) {
    const index = readIndex(cursor);

    if (index?.scope.root === true) {
      return {
        absolutePath: cursor,
        relativePath: workspaceRelative(workspaceRoot, cursor),
        source: 'nearest marked ancestor',
      };
    }

    if (cursor === workspaceRoot) {
      return {
        absolutePath: workspaceRoot,
        relativePath: '.',
        source: 'workspace fallback',
      };
    }

    const parent = dirname(cursor);

    if (parent === cursor) {
      return {
        absolutePath: workspaceRoot,
        relativePath: '.',
        source: 'workspace fallback',
      };
    }

    cursor = parent;
  }
}

export function createGenerateFilter(params: {
  rootAbsolute: string;
  respectGitignore: boolean;
  includeHidden: boolean;
  extraIgnore: string[];
  targetRelativeToRoot: string;
}): IgnoreFilter {
  return new IgnoreFilter(
    params.rootAbsolute,
    params.respectGitignore,
    !params.includeHidden,
    params.extraIgnore,
    params.targetRelativeToRoot === '.' ? null : params.targetRelativeToRoot,
  );
}

export function listGenerateEntries(params: {
  rootAbsolute: string;
  directoryAbsolute: string;
  filter: IgnoreFilter;
}): { files: GenerateEntry[]; directories: GenerateEntry[] } {
  const files: GenerateEntry[] = [];
  const directories: GenerateEntry[] = [];

  for (const name of readdirSync(params.directoryAbsolute).sort((a, b) =>
    a.localeCompare(b),
  )) {
    if (
      name === BOTTOMUP_INDEX_FILE ||
      name === 'BOTTOMUP_SUMMARY.md' ||
      name === 'BOTTOMUP_SUMMARY.json'
    ) {
      continue;
    }

    const absolutePath = join(params.directoryAbsolute, name);
    const stats = lstatSync(absolutePath);

    if (stats.isSymbolicLink()) {
      continue;
    }

    const relativePath = workspaceRelative(params.rootAbsolute, absolutePath);
    const isDirectory = stats.isDirectory();

    const filterEntry: FilterEntry = {
      name,
      relativePosix: relativePath,
      isDirectory,
    };

    if (params.filter.shouldIgnore(filterEntry)) {
      continue;
    }

    const entry = { name, absolutePath, relativePath, isDirectory };
    (isDirectory ? directories : files).push(entry);
  }

  return { files, directories };
}

export function readSourceSnippet(
  entry: GenerateEntry,
  maxBytes = 24_000,
): { text: string | null; size: number; truncated: boolean } {
  const buffer = readFileSync(entry.absolutePath);

  if (buffer.includes(0)) {
    return { text: null, size: buffer.length, truncated: false };
  }

  if (buffer.length <= maxBytes) {
    return {
      text: buffer.toString('utf8'),
      size: buffer.length,
      truncated: false,
    };
  }

  const marker = Buffer.from('\n\n[... source middle truncated ...]\n\n');
  const available = Math.max(0, maxBytes - marker.length);
  const headBytes = Math.ceil(available / 2);
  const tailBytes = available - headBytes;

  const clipped = Buffer.concat([
    buffer.subarray(0, headBytes),
    marker,
    buffer.subarray(buffer.length - tailBytes),
  ]);

  return {
    text: clipped.toString('utf8'),
    size: buffer.length,
    truncated: true,
  };
}

export function directFileHashes(
  entries: GenerateEntry[],
): Record<string, string> {
  return Object.fromEntries(
    entries.map((entry) => [
      entry.name,
      hashText(readFileSync(entry.absolutePath)),
    ]),
  );
}

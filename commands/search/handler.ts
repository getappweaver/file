import { existsSync, statSync } from 'fs';
import { relative, resolve } from 'path';

import { ripgrep } from 'ripgrep';

export type FileSearchMatch = {
  path: string;
  lineNumber: number;
  column: number;
  line: string;
};

export type FileSearchOk = {
  type: 'ok';
  keyword: string;
  extOption: string | null;
  pathOption: string | null;
  matches: FileSearchMatch[];
  truncated: boolean;
  limit: number;
};

export type FileSearchErr = {
  type: 'error';
  text: string;
};

export type FileSearchResult = FileSearchOk | FileSearchErr;

type HandleSearchCommandProps = {
  workspaceRoot: string;
  keyword: string;
  extOption: string | null;
  pathOption: string | null;
  regex: boolean;
  limit: number;
};

type RipgrepJsonLine = {
  type?: string;
  data?: {
    path?: { text?: string };
    lines?: { text?: string };
    line_number?: number;
    absolute_offset?: number;
    submatches?: Array<{ start?: number }>;
  };
};

function normalizeExts(extOption: string | null): string[] {
  if (extOption === null) {
    return [];
  }

  return extOption
    .split(',')
    .map((ext) => ext.trim())
    .filter((ext) => ext.length > 0)
    .map((ext) => (ext.startsWith('.') ? ext.slice(1) : ext));
}

function resolveSearchTarget(props: {
  workspaceRoot: string;
  pathOption: string | null;
}): string {
  const root = resolve(props.workspaceRoot);
  const target = resolve(root, props.pathOption ?? '.');
  const rel = relative(root, target);

  if (rel.startsWith('..') || rel === '..') {
    throw new Error('Path escapes workspace');
  }

  if (!existsSync(target)) {
    throw new Error(`Path does not exist: ${props.pathOption ?? '.'}`);
  }

  if (!statSync(target).isDirectory()) {
    throw new Error(`Not a directory: ${props.pathOption ?? '.'}`);
  }

  return target;
}

function normalizeMatchPath(props: {
  workspaceRoot: string;
  pathText: string;
}): string {
  const rel = relative(props.workspaceRoot, props.pathText).replace(/\\/g, '/');

  if (!rel.startsWith('..') && rel !== '..' && rel.length > 0) {
    return rel;
  }

  return props.pathText.replace(/\\/g, '/');
}

function parseRipgrepJson(props: {
  stdout: string;
  workspaceRoot: string;
  limit: number;
}): FileSearchMatch[] {
  const matches: FileSearchMatch[] = [];

  for (const rawLine of props.stdout.split(/\r?\n/)) {
    if (rawLine.trim().length === 0) {
      continue;
    }

    let event: RipgrepJsonLine;

    try {
      event = JSON.parse(rawLine) as RipgrepJsonLine;
    } catch {
      continue;
    }

    if (event.type !== 'match') {
      continue;
    }

    const path = event.data?.path?.text;
    const line = event.data?.lines?.text;
    const lineNumber = event.data?.line_number;

    if (
      typeof path !== 'string' ||
      typeof line !== 'string' ||
      typeof lineNumber !== 'number'
    ) {
      continue;
    }

    const firstSubmatch = event.data?.submatches?.[0];

    const column =
      typeof firstSubmatch?.start === 'number' ? firstSubmatch.start + 1 : 1;

    matches.push({
      path: normalizeMatchPath({
        workspaceRoot: props.workspaceRoot,
        pathText: path,
      }),
      lineNumber,
      column,
      line: line.replace(/\r?\n$/, ''),
    });

    if (matches.length >= props.limit) {
      break;
    }
  }

  return matches;
}

export async function handleSearchCommand(
  props: HandleSearchCommandProps,
): Promise<FileSearchResult> {
  try {
    const target = resolveSearchTarget({
      workspaceRoot: props.workspaceRoot,
      pathOption: props.pathOption,
    });

    const args = [
      '--json',
      '--line-number',
      '--column',
      '--smart-case',
      '--max-count',
      String(props.limit + 1),
      '--glob',
      '!node_modules/**',
      '--glob',
      '!.git/**',
      '--glob',
      '!dist/**',
      '--glob',
      '!build/**',
    ];

    if (!props.regex) {
      args.push('--fixed-strings');
    }

    for (const ext of normalizeExts(props.extOption)) {
      args.push('--glob', `*.${ext}`);
    }

    args.push(props.keyword, target);

    const { code, stdout, stderr } = await ripgrep(args, { buffer: true });

    if (code !== 0 && code !== 1) {
      return {
        type: 'error',
        text: stderr.trim() || `ripgrep exited with code ${code}`,
      };
    }

    const parsedMatches = parseRipgrepJson({
      stdout,
      workspaceRoot: props.workspaceRoot,
      limit: props.limit + 1,
    });

    const truncated = parsedMatches.length > props.limit;

    return {
      type: 'ok',
      keyword: props.keyword,
      extOption: props.extOption,
      pathOption: props.pathOption,
      matches: parsedMatches.slice(0, props.limit),
      truncated,
      limit: props.limit,
    };
  } catch (err) {
    return {
      type: 'error',
      text: String(err instanceof Error ? err.message : err),
    };
  }
}

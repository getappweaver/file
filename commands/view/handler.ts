import { readFileSync, statSync } from 'fs';
import { relative, resolve } from 'path';

const DEFAULT_MAX_BYTES = 256 * 1024;

type HandleViewCommandProps = {
  workspaceRoot: string;
  relativePath: string;
  maxBytes: number;
};

export type FileViewOk = {
  type: 'ok';
  relativePath: string;
  content: string;
  truncated: boolean;
  binary: boolean;
  byteLength: number;
};

export type FileViewErr = {
  type: 'error';
  text: string;
};

export type FileViewResult = FileViewOk | FileViewErr;

export function handleViewCommand(
  props: HandleViewCommandProps,
): FileViewResult {
  const rel = props.relativePath.trim();

  if (rel.length === 0) {
    return { type: 'error', text: 'Missing file path.' };
  }

  const abs = resolve(props.workspaceRoot, rel);
  const under = relative(props.workspaceRoot, abs);

  if (under.startsWith('..') || under === '..') {
    return { type: 'error', text: 'Path escapes workspace.' };
  }

  let st: ReturnType<typeof statSync>;

  try {
    st = statSync(abs);
  } catch {
    return { type: 'error', text: `Not found: ${rel}` };
  }

  if (st.isDirectory()) {
    return { type: 'error', text: `Not a file: ${rel}` };
  }

  const size = st.size;
  const buf = readFileSync(abs);
  const truncated = buf.length > props.maxBytes;
  const slice = buf.subarray(0, props.maxBytes);

  if (slice.includes(0)) {
    return {
      type: 'ok',
      relativePath: under.replace(/\\/g, '/'),
      content: '',
      truncated,
      binary: true,
      byteLength: size,
    };
  }

  const content = slice.toString('utf8');

  return {
    type: 'ok',
    relativePath: under.replace(/\\/g, '/'),
    content,
    truncated,
    binary: false,
    byteLength: size,
  };
}

export function defaultViewMaxBytes(): number {
  return DEFAULT_MAX_BYTES;
}

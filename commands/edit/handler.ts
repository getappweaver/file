import { existsSync, statSync, writeFileSync } from 'fs';
import { relative, resolve } from 'path';

export type FileEditResult =
  | {
      type: 'ok';
      relativePath: string;
    }
  | {
      type: 'error';
      text: string;
    };

type HandleEditCommandProps = {
  workspaceRoot: string;
  relativePath: string;
  content: string;
};

export function handleEditCommand(
  props: HandleEditCommandProps,
): FileEditResult {
  const rel = props.relativePath.trim();

  if (rel.length === 0) {
    return { type: 'error', text: 'Missing file path.' };
  }

  const abs = resolve(props.workspaceRoot, rel);
  const under = relative(props.workspaceRoot, abs);

  if (under.startsWith('..') || under === '..') {
    return { type: 'error', text: 'Path escapes workspace.' };
  }

  if (!existsSync(abs)) {
    return { type: 'error', text: `Not found: ${rel}` };
  }

  const st = statSync(abs);

  if (st.isDirectory()) {
    return { type: 'error', text: `Not a file: ${rel}` };
  }

  writeFileSync(abs, props.content, 'utf8');

  return { type: 'ok', relativePath: under.replace(/\\/g, '/') };
}

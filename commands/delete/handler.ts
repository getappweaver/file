import { existsSync, rmSync } from 'fs';
import { dirname, relative, resolve } from 'path';

export type FileDeleteResult =
  | {
      type: 'ok';
      relativePath: string;
      parentDir: string;
    }
  | {
      type: 'error';
      text: string;
    };

type HandleDeleteCommandProps = {
  workspaceRoot: string;
  relativePath: string;
};

function workspaceRelative(props: {
  workspaceRoot: string;
  absolutePath: string;
}): string | null {
  const rel = relative(props.workspaceRoot, props.absolutePath);

  if (rel.startsWith('..') || rel === '..') {
    return null;
  }

  return rel.replace(/\\/g, '/') || '.';
}

export function handleDeleteCommand(
  props: HandleDeleteCommandProps,
): FileDeleteResult {
  const rel = props.relativePath.trim();

  if (rel.length === 0 || rel === '.') {
    return { type: 'error', text: 'Cannot delete the workspace root.' };
  }

  const abs = resolve(props.workspaceRoot, rel);

  const normalizedRel = workspaceRelative({
    workspaceRoot: props.workspaceRoot,
    absolutePath: abs,
  });

  if (normalizedRel === null) {
    return { type: 'error', text: 'Path escapes workspace.' };
  }

  if (normalizedRel === '.') {
    return { type: 'error', text: 'Cannot delete the workspace root.' };
  }

  if (!existsSync(abs)) {
    return { type: 'error', text: `Not found: ${rel}` };
  }

  rmSync(abs, { recursive: true, force: false });

  return {
    type: 'ok',
    relativePath: normalizedRel,
    parentDir:
      relative(props.workspaceRoot, dirname(abs)).replace(/\\/g, '/') || '.',
  };
}

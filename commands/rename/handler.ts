import { existsSync, renameSync } from 'fs';
import { dirname, relative, resolve } from 'path';

export type FileRenameResult =
  | {
      type: 'ok';
      oldRelativePath: string;
      newRelativePath: string;
      parentDir: string;
    }
  | {
      type: 'error';
      text: string;
    };

type HandleRenameCommandProps = {
  workspaceRoot: string;
  relativePath: string;
  newName: string;
};

function validateName(nameRaw: string): string | null {
  const name = nameRaw.trim();

  if (name.length === 0 || name === '.' || name === '..') {
    return null;
  }

  if (name.includes('/') || name.includes('\\')) {
    return null;
  }

  return name;
}

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

export function handleRenameCommand(
  props: HandleRenameCommandProps,
): FileRenameResult {
  const rel = props.relativePath.trim();
  const newName = validateName(props.newName);

  if (rel.length === 0) {
    return { type: 'error', text: 'Missing path.' };
  }

  if (newName === null) {
    return {
      type: 'error',
      text: 'New name must be a single name, not a path.',
    };
  }

  const oldAbs = resolve(props.workspaceRoot, rel);

  const oldRel = workspaceRelative({
    workspaceRoot: props.workspaceRoot,
    absolutePath: oldAbs,
  });

  if (oldRel === null) {
    return { type: 'error', text: 'Path escapes workspace.' };
  }

  if (!existsSync(oldAbs)) {
    return { type: 'error', text: `Not found: ${rel}` };
  }

  const parentAbs = dirname(oldAbs);
  const newAbs = resolve(parentAbs, newName);

  const newRel = workspaceRelative({
    workspaceRoot: props.workspaceRoot,
    absolutePath: newAbs,
  });

  if (newRel === null) {
    return { type: 'error', text: 'Path escapes workspace.' };
  }

  if (existsSync(newAbs)) {
    return { type: 'error', text: `Already exists: ${newRel}` };
  }

  renameSync(oldAbs, newAbs);

  return {
    type: 'ok',
    oldRelativePath: oldRel,
    newRelativePath: newRel,
    parentDir:
      relative(props.workspaceRoot, parentAbs).replace(/\\/g, '/') || '.',
  };
}

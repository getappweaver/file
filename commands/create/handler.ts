import { existsSync, mkdirSync, statSync, writeFileSync } from 'fs';
import { relative, resolve } from 'path';

export type FileCreateResult =
  | {
      type: 'ok';
      relativePath: string;
      parentDir: string;
    }
  | {
      type: 'error';
      text: string;
    };

type HandleCreateCommandProps = {
  workspaceRoot: string;
  relativeDir: string;
  name: string;
  kind: 'file' | 'folder';
};

function validateName(value: string): string | null {
  const name = value.trim();

  if (name.length === 0) {
    return null;
  }

  if (name === '.' || name === '..') {
    return null;
  }

  if (name.includes('/') || name.includes('\\')) {
    return null;
  }

  return name;
}

function isUnderWorkspace(props: {
  workspaceRoot: string;
  absolutePath: string;
}): boolean {
  const under = relative(props.workspaceRoot, props.absolutePath);

  return !(under.startsWith('..') || under === '..');
}

export function handleCreateCommand(
  props: HandleCreateCommandProps,
): FileCreateResult {
  const dir = props.relativeDir.trim() || '.';
  const name = validateName(props.name);

  if (name === null) {
    return {
      type: 'error',
      text: 'Name must be a single file or folder name, not a path.',
    };
  }

  const dirAbs = resolve(props.workspaceRoot, dir);

  if (
    !isUnderWorkspace({
      workspaceRoot: props.workspaceRoot,
      absolutePath: dirAbs,
    })
  ) {
    return { type: 'error', text: 'Path escapes workspace.' };
  }

  if (!existsSync(dirAbs)) {
    return { type: 'error', text: `Directory not found: ${dir}` };
  }

  if (!statSync(dirAbs).isDirectory()) {
    return { type: 'error', text: `Not a directory: ${dir}` };
  }

  const targetAbs = resolve(dirAbs, name);

  if (
    !isUnderWorkspace({
      workspaceRoot: props.workspaceRoot,
      absolutePath: targetAbs,
    })
  ) {
    return { type: 'error', text: 'Path escapes workspace.' };
  }

  if (existsSync(targetAbs)) {
    return { type: 'error', text: `Already exists: ${name}` };
  }

  if (props.kind === 'folder') {
    mkdirSync(targetAbs);
  } else {
    writeFileSync(targetAbs, '', 'utf8');
  }

  return {
    type: 'ok',
    relativePath: relative(props.workspaceRoot, targetAbs).replace(/\\/g, '/'),
    parentDir: relative(props.workspaceRoot, dirAbs).replace(/\\/g, '/') || '.',
  };
}

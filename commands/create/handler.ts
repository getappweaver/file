import { existsSync, statSync, writeFileSync } from 'fs';
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
  filename: string;
};

function validateFilename(filename: string): string | null {
  const name = filename.trim();

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
  const filename = validateFilename(props.filename);

  if (filename === null) {
    return {
      type: 'error',
      text: 'Filename must be a single name, not a path.',
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

  const fileAbs = resolve(dirAbs, filename);

  if (
    !isUnderWorkspace({
      workspaceRoot: props.workspaceRoot,
      absolutePath: fileAbs,
    })
  ) {
    return { type: 'error', text: 'Path escapes workspace.' };
  }

  if (existsSync(fileAbs)) {
    return { type: 'error', text: `Already exists: ${filename}` };
  }

  writeFileSync(fileAbs, '', 'utf8');

  return {
    type: 'ok',
    relativePath: relative(props.workspaceRoot, fileAbs).replace(/\\/g, '/'),
    parentDir: relative(props.workspaceRoot, dirAbs).replace(/\\/g, '/') || '.',
  };
}

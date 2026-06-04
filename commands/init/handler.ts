import { existsSync } from 'fs';
import { join } from 'path';

import { spawnSync } from 'bun';

export type FileInitResult =
  | {
      type: 'ok';
      alreadyInitialized: boolean;
      text: string;
    }
  | {
      type: 'error';
      text: string;
    };

type HandleInitCommandProps = {
  workspaceRoot: string;
};

function runGit(args: string[], cwd: string): ReturnType<typeof spawnSync> {
  return spawnSync(['git', ...args], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });
}

function outputText(result: ReturnType<typeof spawnSync>): string {
  const stderr = Buffer.from(result.stderr ?? new Uint8Array())
    .toString('utf8')
    .trim();

  const stdout = Buffer.from(result.stdout ?? new Uint8Array())
    .toString('utf8')
    .trim();

  return stderr || stdout;
}

export function handleInitCommand(
  props: HandleInitCommandProps,
): FileInitResult {
  const existing = runGit(
    ['rev-parse', '--is-inside-work-tree'],
    props.workspaceRoot,
  );

  if (existing.exitCode === 0) {
    return {
      type: 'ok',
      alreadyInitialized: true,
      text: 'Git repository already exists for this workspace.',
    };
  }

  if (existsSync(join(props.workspaceRoot, '.git'))) {
    return {
      type: 'error',
      text: 'A .git path exists, but Git could not use it as a repository.',
    };
  }

  const initialized = runGit(['init'], props.workspaceRoot);

  if (initialized.exitCode !== 0) {
    const text = outputText(initialized);

    return {
      type: 'error',
      text: text.length > 0 ? text : 'Could not initialize Git repository.',
    };
  }

  return {
    type: 'ok',
    alreadyInitialized: false,
    text: 'Initialized Git repository for this workspace.',
  };
}

// ---------------------------------------------------------------------------
// plugins/file/tree-cli.ts — CLI entry for workspace tree (shared with !file tree)
// ---------------------------------------------------------------------------

import { basename } from 'path';

import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import { buildWorkspaceTree, parseTreeCliArgs } from './workspace-tree';

const APPWEAVER_WORKSPACE_FLAG = '--appweaver-workspace';

function stripTreeCliFlags(argv: string[]): {
  rest: string[];
  useDmBotWorkspace: boolean;
} {
  let useDmBotWorkspace = false;
  const rest: string[] = [];

  for (const a of argv) {
    if (a === APPWEAVER_WORKSPACE_FLAG) {
      useDmBotWorkspace = true;
    } else {
      rest.push(a);
    }
  }

  return { rest, useDmBotWorkspace };
}

function printHelp(prog: string): void {
  const name = basename(prog);

  console.log(
    [
      `Usage: ${name} [maxDepth] [targetDir] [--ext ext1,ext2] [${APPWEAVER_WORKSPACE_FLAG}]`,
      '',
      'By default the tree root is the shell current working directory (process.cwd()).',
      `Pass ${APPWEAVER_WORKSPACE_FLAG} to use AppWeaver workspace_target instead`,
      '(AppWeaver package dir vs parent — same as !file tree).',
      '',
      'Examples:',
      `  ${name}                    # depth 0, from cwd`,
      `  ${name} 2`,
      `  ${name} 3 src              # src relative to cwd`,
      `  ${name} 2 . --ext ts,tsx`,
      `  ${name} ${APPWEAVER_WORKSPACE_FLAG} 2  # depth 2 from AppWeaver workspace root`,
    ].join('\n'),
  );
}

export function main(argv: string[]): void {
  if (argv[0] === '-h' || argv[0] === '--help') {
    printHelp(process.argv[1] ?? 'tree');

    return;
  }

  const { rest, useDmBotWorkspace } = stripTreeCliFlags(argv);
  const { maxDepth, targetDirRelative, extFilter } = parseTreeCliArgs(rest);

  const workspaceRoot = useDmBotWorkspace
    ? resolveFileWorkspaceRoot()
    : process.cwd();

  console.log(
    buildWorkspaceTree({
      workspaceRoot,
      targetDirRelative,
      maxDepth,
      extFilter,
    }),
  );
}

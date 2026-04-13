import { dirname, join, relative } from 'path';

import type { Database } from 'bun:sqlite';

import type { BottomupCall, BottomupContextCall } from '../../ai/schema';

import { executeSummarizeTool } from '../summarize/handler';

import { renderBottomupRunSummary } from './handlers/doc';
import {
  IgnoreFilter,
  listChildBottomupStatus,
  readBottomupFile,
  resolveScopeRoot,
  resolveWorkingDirectory,
  toPosix,
} from './handlers/fs';
import {
  normalizeBottomupOptions,
  normalizeContextOptions,
} from './handlers/options';
import { buildDirectoryNode, refineDirectoryNodePass2 } from './handlers/tree';

export async function executeBottomupTool(params: {
  workspaceRoot: string;
  call: BottomupCall;
  db: Database;
}): Promise<string> {
  void params.db;
  const options = normalizeBottomupOptions(params.call);

  const target = resolveWorkingDirectory(
    params.workspaceRoot,
    options.workingDir,
  );

  const scopeRoot = resolveScopeRoot({
    workspaceRoot: params.workspaceRoot,
    scopeRoot: options.scopeRoot,
    workingDirAbsolute: target.absolutePath,
    workingDirRelative: target.relativePosix,
  });

  const filter = new IgnoreFilter(
    scopeRoot.absolutePath,
    options.respectGitignore,
    options.excludeHidden,
    options.extraIgnore,
    target.relativePosix === '.' ? null : target.relativePosix,
  );

  const root = await buildDirectoryNode({
    workspaceRoot: scopeRoot.absolutePath,
    agentCwd: params.workspaceRoot,
    scopeRootRelativePosix:
      toPosix(relative(scopeRoot.absolutePath, scopeRoot.absolutePath)) || '.',
    directoryPath: target.absolutePath,
    directoryRelativePosix:
      toPosix(relative(scopeRoot.absolutePath, target.absolutePath)) || '.',
    remainingDepth: options.depth,
    options,
    filter,
  });

  const pass1Summary = renderBottomupRunSummary(root, scopeRoot.absolutePath);

  if (!options.twoPass) {
    return pass1Summary;
  }

  // Pass 2: collect big picture from existing docs, then refine top-down
  const bigPicture = await executeSummarizeTool({
    workspaceRoot: params.workspaceRoot,
    call: {
      type: 'summarize',
      working_dir: options.workingDir,
      scope_root: options.scopeRoot,
      depth: options.depth,
      respect_gitignore: options.respectGitignore,
      exclude_hidden: options.excludeHidden,
      extra_ignore: options.extraIgnore,
      include_file_summaries: true,
      model: options.model,
      max_file_bytes: null,
    },
    db: params.db,
  });

  const pass2Result = await refineDirectoryNodePass2({
    agentCwd: params.workspaceRoot,
    directoryPath: target.absolutePath,
    directoryRelativePosix:
      toPosix(relative(scopeRoot.absolutePath, target.absolutePath)) || '.',
    bigPicture,
    model: options.model,
    filter,
    workspaceRoot: scopeRoot.absolutePath,
    remainingDepth: options.depth,
  });

  return [
    pass1Summary,
    '',
    `Pass 2: ${pass2Result.updated} updated, ${pass2Result.skipped} unchanged, ${pass2Result.stale} skipped (stale/missing).`,
  ].join('\n');
}

export async function executeBottomupContextTool(params: {
  workspaceRoot: string;
  call: BottomupContextCall;
  db: Database;
}): Promise<string> {
  void params.db;
  const options = normalizeContextOptions(params.call);

  const target = resolveWorkingDirectory(
    params.workspaceRoot,
    options.workingDir,
  );

  const scopeRoot = resolveScopeRoot({
    workspaceRoot: params.workspaceRoot,
    scopeRoot: options.scopeRoot,
    workingDirAbsolute: target.absolutePath,
    workingDirRelative: target.relativePosix,
  });

  const filter = new IgnoreFilter(
    scopeRoot.absolutePath,
    options.respectGitignore,
    options.excludeHidden,
    options.extraIgnore,
    target.relativePosix === '.' ? null : target.relativePosix,
  );

  const targetRelativePosix =
    toPosix(relative(scopeRoot.absolutePath, target.absolutePath)) || '.';

  const lines = [
    `Target directory: ${targetRelativePosix}`,
    `Scope root: ${scopeRoot.relativePosix}`,
    '',
  ];

  const currentDoc = readBottomupFile(
    join(target.absolutePath, '__BOTTOMUP.md'),
  );

  lines.push('Current __BOTTOMUP.md:');

  lines.push(
    currentDoc
      ? currentDoc
      : `Missing __BOTTOMUP.md in ${target.relativePosix}.`,
  );

  if (options.parentDepth > 0) {
    lines.push('', 'Parent context:');
    let cursorAbsolute = dirname(target.absolutePath);
    for (let index = 0; index < options.parentDepth; index++) {
      const rel =
        toPosix(relative(scopeRoot.absolutePath, cursorAbsolute)) || '.';

      if (rel.startsWith('..')) {
        break;
      }

      const doc = readBottomupFile(join(cursorAbsolute, '__BOTTOMUP.md'));
      lines.push(`- ${rel}: ${doc ? 'present' : 'missing'}`);

      if (doc) {
        lines.push('', doc, '');
      }

      if (cursorAbsolute === scopeRoot.absolutePath) {
        break;
      }

      cursorAbsolute = dirname(cursorAbsolute);
    }
  }

  if (options.childDepth > 0) {
    lines.push('', 'Child bottom-up status:');

    const childLines = listChildBottomupStatus({
      workspaceRoot: scopeRoot.absolutePath,
      directoryPath: target.absolutePath,
      relativePosix: targetRelativePosix,
      depth: options.childDepth,
      filter,
      indent: '',
    });

    lines.push(
      ...(childLines.length > 0 ? childLines : ['- no visible subdirectories']),
    );
  }

  return lines.join('\n').trim();
}

import { join, relative } from 'path';

import type { Database } from 'bun:sqlite';

import type { TopdownCall } from '../../ai/schema';

import { parseExistingBottomupDoc } from '../bottomup/handlers/doc';
import {
  IgnoreFilter,
  relativePosixFromRoot,
  resolveScopeRoot,
  resolveWorkingDirectory,
  toPosix,
} from '../bottomup/handlers/fs';
import { normalizeTopdownOptions } from '../bottomup/handlers/options';
import { parseBottomupSummaryCache } from '../bottomup/handlers/summary-cache';
import { refineDirectoryNodePass2 } from '../bottomup/handlers/tree';
import {
  BOTTOMUP_FILE,
  BOTTOMUP_SUMMARY_FILE,
} from '../bottomup/handlers/types';

export async function executeTopdownTool(params: {
  workspaceRoot: string;
  call: TopdownCall;
  db: Database;
}): Promise<string> {
  void params.db;
  const options = normalizeTopdownOptions(params.call);

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

  const targetRelativeToScope = relativePosixFromRoot(
    scopeRoot.absolutePath,
    target.absolutePath,
  );

  const filter = new IgnoreFilter(
    scopeRoot.absolutePath,
    options.respectGitignore,
    options.excludeHidden,
    options.extraIgnore,
    targetRelativeToScope === '.' ? null : targetRelativeToScope,
  );

  const summaryPath = join(target.absolutePath, BOTTOMUP_SUMMARY_FILE);
  const summary = parseBottomupSummaryCache(summaryPath);

  if (summary === null) {
    throw new Error(
      `Missing or invalid ${BOTTOMUP_SUMMARY_FILE} in ${target.relativePosix}. Run summarize --write-summary first.`,
    );
  }

  const rootDoc = parseExistingBottomupDoc(
    join(target.absolutePath, BOTTOMUP_FILE),
  );

  if (rootDoc?.subtreeHash === null || rootDoc?.subtreeHash === undefined) {
    throw new Error(
      `Missing ${BOTTOMUP_FILE} with subtree_hash in ${target.relativePosix}. Run bottomup first.`,
    );
  }

  if (!options.force && rootDoc.subtreeHash !== summary.subtreeHash) {
    throw new Error(
      `${BOTTOMUP_SUMMARY_FILE} is stale for ${target.relativePosix}. Run summarize --write-summary again, or pass --force.`,
    );
  }

  const result = await refineDirectoryNodePass2({
    agentCwd: params.workspaceRoot,
    directoryPath: target.absolutePath,
    directoryRelativePosix:
      toPosix(relative(scopeRoot.absolutePath, target.absolutePath)) || '.',
    bigPicture: summary.body,
    model: options.model,
    filter,
    workspaceRoot: scopeRoot.absolutePath,
    remainingDepth: options.depth,
    summaryHash: summary.summaryHash,
    force: options.force,
  });

  return `Topdown: ${result.updated} updated, ${result.skipped} skipped, ${result.stale} stale/missing.\nsummary_hash: ${summary.summaryHash}`;
}

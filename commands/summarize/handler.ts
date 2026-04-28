import { readFileSync } from 'fs';
import { join } from 'path';

import type { Database } from 'bun:sqlite';

import { log } from '@src/logger';

import type { SummarizeCall } from '../../ai/schema';

import { parseExistingBottomupDoc } from '../bottomup/handlers/doc';
import {
  resolveWorkingDirectory,
  resolveScopeRoot,
  IgnoreFilter,
  relativePosixFromRoot,
} from '../bottomup/handlers/fs';
import { listDirectoryEntries } from '../bottomup/handlers/fs';
import { sha256Hex, hashObject } from '../bottomup/handlers/fs';
import { normalizeSummarizeOptions } from '../bottomup/handlers/options';
import { writeBottomupSummaryCache } from '../bottomup/handlers/summary-cache';
import { BOTTOMUP_FILE } from '../bottomup/handlers/types';

function computeCurrentHashes(
  workspaceRoot: string,
  directoryPath: string,
  filter: IgnoreFilter,
): { directHash: string; subtreeHash: string } {
  const { files, directories } = listDirectoryEntries(
    workspaceRoot,
    directoryPath,
    filter,
  );

  const fileHashes = Object.fromEntries(
    files.map((entry) => [
      entry.name,
      sha256Hex(readFileSync(entry.absolutePath)),
    ]),
  );

  const childHashes: Record<string, string> = {};
  for (const directory of directories) {
    const docPath = join(directory.absolutePath, BOTTOMUP_FILE);
    const doc = parseExistingBottomupDoc(docPath);

    if (doc?.subtreeHash) {
      childHashes[directory.name] = doc.subtreeHash;
    }
  }

  const directHash = hashObject({ files: fileHashes });

  const subtreeHash = hashObject({
    directHash,
    children: childHashes,
  });

  return { directHash, subtreeHash };
}

function collectBottomupFiles(
  workspaceRoot: string,
  directoryPath: string,
  relativePosix: string,
  depth: number | null,
  filter: IgnoreFilter,
  indent: string,
): {
  docs: { relativePosix: string; content: string }[];
  warnings: string[];
} {
  const docs: { relativePosix: string; content: string }[] = [];
  const warnings: string[] = [];

  const docPath = join(directoryPath, BOTTOMUP_FILE);
  const existingDoc = parseExistingBottomupDoc(docPath);

  if (!existingDoc) {
    warnings.push(`${indent}missing: ${relativePosix}/${BOTTOMUP_FILE}`);
  } else {
    const { directHash } = computeCurrentHashes(
      workspaceRoot,
      directoryPath,
      filter,
    );

    if (existingDoc.directHash !== directHash) {
      warnings.push(
        `${indent}stale: ${relativePosix}/${BOTTOMUP_FILE} (hash mismatch)`,
      );
    }

    const raw = readFileSync(docPath, 'utf8');
    const body = raw.replace(/^---[\s\S]*?---\n?/, '');
    docs.push({ relativePosix, content: body });
  }

  if (depth === null || depth > 0) {
    const childDepth = depth === null ? null : depth - 1;

    const { directories } = listDirectoryEntries(
      workspaceRoot,
      directoryPath,
      filter,
    );

    for (const directory of directories) {
      const childResult = collectBottomupFiles(
        workspaceRoot,
        directory.absolutePath,
        directory.relativePosix,
        childDepth,
        filter,
        indent + '  ',
      );

      docs.push(...childResult.docs);
      warnings.push(...childResult.warnings);
    }
  }

  return { docs, warnings };
}

export async function executeSummarizeTool(params: {
  workspaceRoot: string;
  call: SummarizeCall;
  db: Database;
}): Promise<string> {
  void params.db;
  const options = normalizeSummarizeOptions(params.call);

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

  log.info(
    `summarize: reading ${target.relativePosix} (depth: ${options.depth === null ? 'unlimited' : String(options.depth)})`,
  );

  const { docs, warnings } = collectBottomupFiles(
    scopeRoot.absolutePath,
    target.absolutePath,
    targetRelativeToScope,
    options.depth,
    filter,
    '',
  );

  if (warnings.length > 0) {
    log.warn('summarize: warnings:');
    for (const warning of warnings) {
      log.warn(`summarize: ${warning}`);
    }
  }

  if (docs.length === 0) {
    return `No ${BOTTOMUP_FILE} files found under ${target.relativePosix}.`;
  }

  const body = docs.map((d) => d.content).join('\n\n');

  if (!options.writeSummary) {
    return body;
  }

  const rootDoc = parseExistingBottomupDoc(
    join(target.absolutePath, BOTTOMUP_FILE),
  );

  if (rootDoc?.subtreeHash === null || rootDoc?.subtreeHash === undefined) {
    throw new Error(
      `Cannot write summary cache: missing ${BOTTOMUP_FILE} with subtree_hash in ${target.relativePosix}.`,
    );
  }

  const written = writeBottomupSummaryCache({
    directoryPath: target.absolutePath,
    subtreeHash: rootDoc.subtreeHash,
    depth: options.depth,
    respectGitignore: options.respectGitignore,
    excludeHidden: options.excludeHidden,
    includeFileSummaries: options.includeFileSummaries,
    body,
  });

  return `Wrote ${written.filePath}\nsummary_hash: ${written.summaryHash}\nsubtree_hash: ${rootDoc.subtreeHash}`;
}

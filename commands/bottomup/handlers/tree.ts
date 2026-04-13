import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { basename, join } from 'path';

import { log } from '@src/logger';

import { refineDirectoryWithAi, summarizeDirectoryWithAi } from './ai';
import { parseExistingBottomupDoc, renderBottomupMarkdown } from './doc';
import type { IgnoreFilter } from './fs';
import {
  hashObject,
  listDirectoryEntries,
  readFileSnippet,
  sha256Hex,
  toPosix,
} from './fs';
import {
  BOTTOMUP_FILE,
  type BottomupResolvedOptions,
  type DirectoryNode,
} from './types';

export async function buildDirectoryNode(params: {
  workspaceRoot: string;
  agentCwd: string;
  scopeRootRelativePosix: string;
  directoryPath: string;
  directoryRelativePosix: string;
  remainingDepth: number | null;
  options: BottomupResolvedOptions;
  filter: IgnoreFilter;
}): Promise<DirectoryNode> {
  log.info(
    `bottomup: scanning ${params.directoryRelativePosix} (remaining depth: ${params.remainingDepth === null ? 'unlimited' : String(params.remainingDepth)})`,
  );

  const { files, directories } = listDirectoryEntries(
    params.workspaceRoot,
    params.directoryPath,
    params.filter,
  );

  const childDepth =
    params.remainingDepth === null
      ? null
      : Math.max(params.remainingDepth - 1, 0);

  const children: DirectoryNode[] = [];

  if (params.remainingDepth === null || params.remainingDepth > 0) {
    for (const directory of directories) {
      children.push(
        await buildDirectoryNode({
          workspaceRoot: params.workspaceRoot,
          agentCwd: params.agentCwd,
          scopeRootRelativePosix: params.scopeRootRelativePosix,
          directoryPath: directory.absolutePath,
          directoryRelativePosix: directory.relativePosix,
          remainingDepth: childDepth,
          options: params.options,
          filter: params.filter,
        }),
      );
    }
  }

  const snippets = files.map((entry) =>
    readFileSnippet(entry, params.options.maxFileBytes),
  );

  const fileHashes = Object.fromEntries(
    files.map((entry) => [
      entry.name,
      sha256Hex(readFileSync(entry.absolutePath)),
    ]),
  );

  const childHashes = Object.fromEntries(
    children.map((child) => [child.name, child.subtreeHash]),
  );

  const directHash = hashObject({ files: fileHashes });

  const subtreeHash = hashObject({
    directHash,
    children: Object.fromEntries(
      Object.entries(childHashes).sort((a, b) => a[0].localeCompare(b[0])),
    ),
  });

  const existingDoc = parseExistingBottomupDoc(
    join(params.directoryPath, BOTTOMUP_FILE),
  );

  if (
    existingDoc &&
    existingDoc.directHash === directHash &&
    existingDoc.subtreeHash === subtreeHash
  ) {
    log.info(`bottomup: skipping unchanged ${params.directoryRelativePosix}`);

    if (!existingDoc.directorySummary) {
      throw new Error(
        `Existing ${BOTTOMUP_FILE} is missing a directory summary in ${params.directoryRelativePosix}.`,
      );
    }

    if (params.options.includeFileSummaries) {
      for (const file of files) {
        if (!existingDoc.fileSummaries[file.name]) {
          throw new Error(
            `Existing ${BOTTOMUP_FILE} is missing a file summary for ${params.directoryRelativePosix}/${file.name}.`,
          );
        }
      }
    }

    for (const child of children) {
      if (!existingDoc.subdirectorySummaries[child.name]) {
        throw new Error(
          `Existing ${BOTTOMUP_FILE} is missing a subdirectory summary for ${params.directoryRelativePosix}/${child.name}.`,
        );
      }
    }

    return {
      name:
        params.directoryRelativePosix === '.'
          ? basename(params.workspaceRoot)
          : basename(params.directoryPath),
      relativePosix: params.directoryRelativePosix,
      absolutePath: params.directoryPath,
      docRelativePosix: toPosix(
        join(params.directoryRelativePosix, BOTTOMUP_FILE),
      ),
      preserveScopeRootMarker: existingDoc.preserveScopeRootMarker,
      directHash,
      subtreeHash,
      fileHashes,
      childHashes,
      wasSkipped: true,
      directorySummary: existingDoc.directorySummary,
      notes: existingDoc.notes,
      files: params.options.includeFileSummaries
        ? files.map((file) => ({
            name: file.name,
            relativePosix: file.relativePosix,
            summary: existingDoc.fileSummaries[file.name] || '',
          }))
        : [],
      subdirectories: children.map((child) => ({
        name: child.name,
        relativePosix: child.relativePosix,
        summary: existingDoc.subdirectorySummaries[child.name] || '',
      })),
      children,
    };
  }

  const aiSummary = await summarizeDirectoryWithAi({
    agentCwd: params.agentCwd,
    directoryName: basename(params.directoryPath),
    directoryRelativePosix: params.directoryRelativePosix,
    files: snippets,
    children,
    includeFileSummaries: params.options.includeFileSummaries,
    model: params.options.model,
  });

  const node: DirectoryNode = {
    name:
      params.directoryRelativePosix === '.'
        ? basename(params.workspaceRoot)
        : basename(params.directoryPath),
    relativePosix: params.directoryRelativePosix,
    absolutePath: params.directoryPath,
    docRelativePosix: toPosix(
      join(params.directoryRelativePosix, BOTTOMUP_FILE),
    ),
    preserveScopeRootMarker: existingDoc?.preserveScopeRootMarker ?? false,
    directHash,
    subtreeHash,
    fileHashes,
    childHashes,
    wasSkipped: false,
    directorySummary: aiSummary.directorySummary,
    notes: aiSummary.notes,
    files: params.options.includeFileSummaries
      ? snippets.map((file) => ({
          name: file.name,
          relativePosix: file.relativePosix,
          summary: aiSummary.fileSummaries.get(file.name) || '',
        }))
      : [],
    subdirectories: children.map((child) => ({
      name: child.name,
      relativePosix: child.relativePosix,
      summary: aiSummary.childSummaries.get(child.name) || '',
    })),
    children,
  };

  mkdirSync(node.absolutePath, { recursive: true });
  writeFileSync(join(node.absolutePath, BOTTOMUP_FILE), renderBottomupMarkdown(node), 'utf8');
  log.info(`bottomup: wrote ${join(node.absolutePath, BOTTOMUP_FILE)}`);

  return node;
}

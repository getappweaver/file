import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, relative } from 'path';

import { log } from '@src/logger';

import { toPosix } from './fs';
import type { DirectoryNode, ExistingBottomupDoc } from './types';
import { BOTTOMUP_FILE } from './types';

export function normalizeOneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function parseExistingBottomupDoc(
  filePath: string,
): ExistingBottomupDoc | null {
  if (!existsSync(filePath)) {
    return null;
  }

  const raw = readFileSync(filePath, 'utf8');
  let body = raw;
  let frontmatter = '';
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);

  if (frontmatterMatch) {
    frontmatter = frontmatterMatch[1] ?? '';
    body = raw.slice(frontmatterMatch[0].length);
  }

  const preserveScopeRootMarker = /^scope_root:\s*true\s*$/m.test(frontmatter);

  const directHash =
    frontmatter.match(/^direct_hash:\s*(.+)\s*$/m)?.[1] ?? null;

  const subtreeHash =
    frontmatter.match(/^subtree_hash:\s*(.+)\s*$/m)?.[1] ?? null;

  const fileHashes: Record<string, string> = {};
  const childHashes: Record<string, string> = {};
  let mode: 'files' | 'children' | null = null;

  for (const line of frontmatter.split('\n')) {
    if (line.trim() === 'files:') {
      mode = 'files';
      continue;
    }

    if (line.trim() === 'children:') {
      mode = 'children';
      continue;
    }

    const match = line.match(/^ {2}([^:]+):\s*(.+)$/);

    if (!match) {
      mode = null;
      continue;
    }

    const [, key, value] = match;

    if (mode === 'files') {
      fileHashes[key] = value;
    } else if (mode === 'children') {
      childHashes[key] = value;
    }
  }

  const directorySummaryMatch = body.match(/## Purpose\n([\s\S]*?)(?:\n## |$)/);

  const directorySummary = directorySummaryMatch?.[1]
    ? normalizeOneLine(directorySummaryMatch[1])
    : null;

  const notesBlock = body.match(/## Notes\n([\s\S]*?)(?:\n## |$)/)?.[1] ?? '';

  const notes = notesBlock
    .split('\n')
    .map((line) => line.match(/^- (.+)$/)?.[1] ?? null)
    .filter((value): value is string => value !== null)
    .map(normalizeOneLine);

  const filesBlock = body.match(/## Files\n([\s\S]*?)(?:\n## |$)/)?.[1] ?? '';
  const fileSummaries: Record<string, string> = {};
  for (const line of filesBlock.split('\n')) {
    const match = line.match(/^- `([^`]+)` - (.+)$/);

    if (match) {
      fileSummaries[match[1]] = normalizeOneLine(match[2]);
    }
  }

  const subdirectoriesBlock =
    body.match(/## Subdirectories\n([\s\S]*?)(?:\n## |$)/)?.[1] ?? '';

  const subdirectorySummaries: Record<string, string> = {};
  for (const line of subdirectoriesBlock.split('\n')) {
    const match = line.match(/^- `([^`/]+)\/` - (.+)$/);

    if (match) {
      subdirectorySummaries[match[1]] = normalizeOneLine(match[2]);
    }
  }

  return {
    preserveScopeRootMarker,
    directHash,
    subtreeHash,
    fileHashes,
    childHashes,
    directorySummary,
    notes,
    fileSummaries,
    subdirectorySummaries,
  };
}

export function renderBottomupMarkdown(node: DirectoryNode): string {
  const title = node.relativePosix === '.' ? node.name : node.relativePosix;
  const lines: string[] = ['---'];

  if (node.preserveScopeRootMarker) {
    lines.push('scope_root: true');
  }

  lines.push(`direct_hash: ${node.directHash}`);
  lines.push(`subtree_hash: ${node.subtreeHash}`);
  lines.push('files:');
  for (const [name, hash] of Object.entries(node.fileHashes).sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    lines.push(`  ${name}: ${hash}`);
  }

  lines.push('children:');
  for (const [name, hash] of Object.entries(node.childHashes).sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    lines.push(`  ${name}: ${hash}`);
  }

  lines.push('---', '', `# ${title}`, '', '## Purpose', node.directorySummary);

  if (node.files.length > 0) {
    lines.push('', '## Files');
    for (const file of node.files) {
      lines.push(`- \`${file.name}\` - ${file.summary}`);
    }
  }

  if (node.notes.length > 0) {
    lines.push('', '## Notes');
    for (const note of node.notes) {
      lines.push(`- ${note}`);
    }
  }

  if (node.subdirectories.length > 0) {
    lines.push('', '## Subdirectories');
    for (const child of node.subdirectories) {
      lines.push(`- \`${child.name}/\` - ${child.summary}`);
    }
  }

  lines.push('');

  return lines.join('\n');
}

export function flattenNodes(root: DirectoryNode): DirectoryNode[] {
  return [root, ...root.children.flatMap(flattenNodes)];
}

export function writeBottomupDocs(root: DirectoryNode): void {
  for (const node of flattenNodes(root)) {
    if (node.wasSkipped) {
      continue;
    }

    mkdirSync(node.absolutePath, { recursive: true });

    writeFileSync(
      join(node.absolutePath, BOTTOMUP_FILE),
      renderBottomupMarkdown(node),
      'utf8',
    );

    log.info(`bottomup: wrote ${join(node.absolutePath, BOTTOMUP_FILE)}`);
  }
}

export function renderBottomupRunSummary(
  root: DirectoryNode,
  workspaceRoot: string,
): string {
  const nodes = flattenNodes(root);
  const updatedNodes = nodes.filter((node) => !node.wasSkipped);
  const skippedNodes = nodes.filter((node) => node.wasSkipped);

  const lines = [
    `Processed ${nodes.length} director${nodes.length === 1 ? 'y' : 'ies'} under ${relative(workspaceRoot, root.absolutePath) || '.'}.`,
  ];

  if (updatedNodes.length > 0) {
    lines.push('', 'Updated files:');

    lines.push(
      ...updatedNodes.map(
        (node) =>
          `- ${toPosix(relative(workspaceRoot, join(node.absolutePath, BOTTOMUP_FILE))) || BOTTOMUP_FILE}`,
      ),
    );
  }

  if (skippedNodes.length > 0) {
    lines.push('', 'Skipped unchanged:');

    lines.push(
      ...skippedNodes.map(
        (node) =>
          `- ${toPosix(relative(workspaceRoot, join(node.absolutePath, BOTTOMUP_FILE))) || BOTTOMUP_FILE}`,
      ),
    );
  }

  return lines.join('\n');
}

export function serializeNodeForSummary(
  node: DirectoryNode,
  indent = '',
): string {
  const lines = [
    `${indent}- directory: ${node.relativePosix}`,
    `${indent}  purpose: ${node.directorySummary}`,
  ];

  if (node.files.length > 0) {
    lines.push(`${indent}  files:`);
    for (const file of node.files) {
      lines.push(`${indent}  - ${file.name}: ${file.summary}`);
    }
  }

  if (node.subdirectories.length > 0) {
    lines.push(`${indent}  subdirectories:`);
    for (const child of node.subdirectories) {
      lines.push(`${indent}  - ${child.name}/: ${child.summary}`);
    }
  }

  for (const child of node.children) {
    lines.push(serializeNodeForSummary(child, `${indent}  `));
  }

  return lines.join('\n');
}

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { hashObject } from './fs';
import { BOTTOMUP_SUMMARY_FILE } from './types';

export type BottomupSummaryCache = {
  subtreeHash: string;
  summaryHash: string;
  depth: number | null;
  respectGitignore: boolean;
  excludeHidden: boolean;
  includeFileSummaries: boolean;
  body: string;
};

function boolText(value: boolean): string {
  return value ? 'true' : 'false';
}

export function hashSummaryBody(body: string): string {
  return hashObject({ body });
}

export function parseBottomupSummaryCache(
  filePath: string,
): BottomupSummaryCache | null {
  if (!existsSync(filePath)) {
    return null;
  }

  const raw = readFileSync(filePath, 'utf8');
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!frontmatterMatch) {
    return null;
  }

  const frontmatter = frontmatterMatch[1] ?? '';
  const body = raw.slice(frontmatterMatch[0].length);

  const subtreeHash =
    frontmatter.match(/^subtree_hash:\s*(.+)\s*$/m)?.[1] ?? null;

  const summaryHash =
    frontmatter.match(/^summary_hash:\s*(.+)\s*$/m)?.[1] ?? null;

  const depthRaw = frontmatter.match(/^depth:\s*(.+)\s*$/m)?.[1] ?? null;

  if (subtreeHash === null || summaryHash === null) {
    return null;
  }

  return {
    subtreeHash,
    summaryHash,
    depth: depthRaw === null || depthRaw === 'null' ? null : Number(depthRaw),
    respectGitignore: /^respect_gitignore:\s*true\s*$/m.test(frontmatter),
    excludeHidden: /^exclude_hidden:\s*true\s*$/m.test(frontmatter),
    includeFileSummaries: /^include_file_summaries:\s*true\s*$/m.test(
      frontmatter,
    ),
    body,
  };
}

export function writeBottomupSummaryCache(params: {
  directoryPath: string;
  subtreeHash: string;
  depth: number | null;
  respectGitignore: boolean;
  excludeHidden: boolean;
  includeFileSummaries: boolean;
  body: string;
}): { filePath: string; summaryHash: string } {
  const summaryHash = hashSummaryBody(params.body);
  const filePath = join(params.directoryPath, BOTTOMUP_SUMMARY_FILE);

  const lines = [
    '---',
    `subtree_hash: ${params.subtreeHash}`,
    `summary_hash: ${summaryHash}`,
    `depth: ${params.depth === null ? 'null' : String(params.depth)}`,
    `respect_gitignore: ${boolText(params.respectGitignore)}`,
    `exclude_hidden: ${boolText(params.excludeHidden)}`,
    `include_file_summaries: ${boolText(params.includeFileSummaries)}`,
    '---',
    params.body,
  ];

  writeFileSync(filePath, lines.join('\n'), 'utf8');

  return { filePath, summaryHash };
}

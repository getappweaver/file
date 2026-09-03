import {
  existsSync,
  lstatSync,
  renameSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'fs';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'path';

import type { BottomupSummaryCall } from '../../ai/schema';

import {
  createGenerateFilter,
  directFileHashes,
  hashValue,
  listGenerateEntries,
  readIndex,
  resolveGenerateRoot,
  toPosix,
  workspaceRelative,
} from '../bottomup-generate/fs';
import {
  BOTTOMUP_ENRICHMENT_VERSION,
  BOTTOMUP_SOURCE_VERSION,
  type BottomupIndex,
} from '../bottomup-generate/types';
import {
  computeSummaryHash,
  computeSummaryInputHash,
} from '../bottomup-summarize/hash';

import type {
  SummaryNodeView,
  SummaryProjection,
  SummaryResolvedOptions,
} from './types';

type SummaryCandidate = {
  absolutePath: string;
  path: string;
  parentPath: string | null;
  index: BottomupIndex | null;
  sourceStatus: 'current' | 'missing' | 'stale';
  fileHashes: Record<string, string>;
};

function normalizeOptions(call: BottomupSummaryCall): SummaryResolvedOptions {
  const parentDepth = call.parent_depth ?? 1;

  const childDepth =
    call.child_depth ??
    (call.draft === true || call.location !== null
      ? Number.MAX_SAFE_INTEGER
      : 1);

  if (parentDepth < 0 || childDepth < 0) {
    throw new Error('Summary parent and child depths must be non-negative.');
  }

  return {
    path: call.path,
    root: call.root,
    format: call.format ?? 'markdown',
    parentDepth,
    childDepth,
    location: call.location,
    draft: call.draft ?? false,
  };
}

function sourceInputHash(fileHashes: Record<string, string>): string {
  return hashValue({ version: BOTTOMUP_SOURCE_VERSION, files: fileHashes });
}

function resolveTarget(workspaceRoot: string, inputPath: string) {
  const workspace = resolve(workspaceRoot);
  const absolutePath = resolve(workspace, inputPath);
  const underWorkspace = relative(workspace, absolutePath);

  if (
    underWorkspace === '..' ||
    underWorkspace.startsWith(`..${sep}`) ||
    !existsSync(absolutePath)
  ) {
    throw new Error(`Path is outside the workspace or missing: ${inputPath}`);
  }

  if (lstatSync(absolutePath).isSymbolicLink()) {
    throw new Error(`Path must not be a symbolic link: ${inputPath}`);
  }

  const realWorkspace = realpathSync(workspace);
  const realTarget = realpathSync(absolutePath);
  const realRelative = relative(realWorkspace, realTarget);

  if (realRelative === '..' || realRelative.startsWith(`..${sep}`)) {
    throw new Error(`Path resolves outside the workspace: ${inputPath}`);
  }

  const isDirectory = statSync(absolutePath).isDirectory();

  return {
    absolutePath,
    relativePath: workspaceRelative(workspace, absolutePath),
    directoryAbsolute: isDirectory ? absolutePath : dirname(absolutePath),
    requestedFile: isDirectory ? null : basename(absolutePath),
  };
}

function collectCandidates(params: {
  workspaceRoot: string;
  rootAbsolute: string;
}): SummaryCandidate[] {
  const filter = createGenerateFilter({
    rootAbsolute: params.rootAbsolute,
    respectGitignore: true,
    includeHidden: false,
    extraIgnore: [],
    targetRelativeToRoot: '.',
  });

  const candidates: SummaryCandidate[] = [];

  function visit(absolutePath: string, parentPath: string | null): void {
    const path = workspaceRelative(params.workspaceRoot, absolutePath);

    const entries = listGenerateEntries({
      rootAbsolute: params.rootAbsolute,
      directoryAbsolute: absolutePath,
      filter,
    });

    for (const child of entries.directories) {
      visit(child.absolutePath, path);
    }

    const fileHashes = directFileHashes(entries.files);
    const index = readIndex(absolutePath);

    candidates.push({
      absolutePath,
      path,
      parentPath,
      index,
      sourceStatus:
        index === null
          ? 'missing'
          : index.source.inputHash === sourceInputHash(fileHashes)
            ? 'current'
            : 'stale',
      fileHashes,
    });
  }

  visit(params.rootAbsolute, null);

  return candidates;
}

function directChildren(
  candidates: SummaryCandidate[],
  path: string,
): SummaryCandidate[] {
  return candidates.filter((candidate) => candidate.parentPath === path);
}

function descendants(
  candidates: SummaryCandidate[],
  parent: SummaryCandidate,
): SummaryCandidate[] {
  return candidates.filter((candidate) => {
    const fromParent = relative(parent.absolutePath, candidate.absolutePath);

    return (
      fromParent !== '' &&
      fromParent !== '..' &&
      !fromParent.startsWith(`..${sep}`)
    );
  });
}

function expectedCoverage(
  candidates: SummaryCandidate[],
  candidate: SummaryCandidate,
): BottomupIndex['coverage'] {
  const below = descendants(candidates, candidate);

  const missing = below
    .filter((value) => value.sourceStatus === 'missing')
    .map((value) => value.path);

  const stale = below
    .filter((value) => value.sourceStatus === 'stale')
    .map((value) => value.path);

  return {
    complete: missing.length === 0 && stale.length === 0,
    missing,
    stale,
  };
}

function summaryValidity(candidates: SummaryCandidate[]): Map<string, boolean> {
  const validity = new Map<string, boolean>();

  for (const candidate of candidates) {
    if (candidate.sourceStatus !== 'current' || candidate.index === null) {
      validity.set(candidate.path, false);
      continue;
    }

    const children = directChildren(candidates, candidate.path);

    const currentChildren = children.filter(
      (child) => child.sourceStatus === 'current' && child.index !== null,
    );

    const childSummaries = currentChildren.flatMap((child) =>
      child.index?.summary && validity.get(child.path)
        ? [{ path: child.path, summary: child.index.summary }]
        : [],
    );

    const allCurrentChildrenValid = currentChildren.every(
      (child) => validity.get(child.path) === true,
    );

    const expectedHash = computeSummaryInputHash({
      index: candidate.index,
      children: childSummaries,
      coverage: expectedCoverage(candidates, candidate),
    });

    validity.set(
      candidate.path,
      allCurrentChildrenValid &&
        candidate.index.summary?.inputHash === expectedHash,
    );
  }

  return validity;
}

function childEffectiveContext(index: BottomupIndex): string {
  return [
    index.context?.value ?? '',
    `Parent directory: ${index.path}`,
    index.summary?.value
      ? `Parent compact summary: ${index.summary.value}`
      : `Parent source responsibility: ${index.source.directorySummary}`,
    index.enrichment?.directorySummary
      ? `Parent architectural role: ${index.enrichment.directorySummary}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function enrichmentInputHash(
  sourceHash: string,
  summaryHash: string,
  context: string,
): string {
  return hashValue({
    version: BOTTOMUP_ENRICHMENT_VERSION,
    sourceInputHash: sourceHash,
    summaryHash,
    contextHash: hashValue({ value: context }),
  });
}

function enrichmentValidity(
  candidates: SummaryCandidate[],
): Map<string, boolean> {
  const validity = new Map<string, boolean>();

  for (const candidate of [...candidates].reverse()) {
    if (candidate.sourceStatus !== 'current' || candidate.index === null) {
      validity.set(candidate.path, false);
      continue;
    }

    if (candidate.parentPath === null) {
      const context = candidate.index.context?.value;

      validity.set(
        candidate.path,
        context !== undefined &&
          candidate.index.enrichment !== null &&
          candidate.index.summary !== null &&
          candidate.index.enrichment.summaryHash ===
            computeSummaryHash(candidate.index.summary) &&
          candidate.index.enrichment.inputHash ===
            enrichmentInputHash(
              candidate.index.source.inputHash,
              computeSummaryHash(candidate.index.summary),
              context,
            ),
      );

      continue;
    }

    const parent = candidates.find(
      (value) => value.path === candidate.parentPath,
    );

    if (
      parent?.index === null ||
      parent?.index === undefined ||
      validity.get(parent.path) !== true
    ) {
      validity.set(candidate.path, false);
      continue;
    }

    validity.set(
      candidate.path,
      candidate.index.enrichment?.inputHash ===
        enrichmentInputHash(
          candidate.index.source.inputHash,
          candidate.index.summary === null
            ? ''
            : computeSummaryHash(candidate.index.summary),
          childEffectiveContext(parent.index),
        ),
    );
  }

  return validity;
}

function selectedCandidates(params: {
  candidates: SummaryCandidate[];
  target: SummaryCandidate;
  parentDepth: number;
  childDepth: number;
}): Array<{
  candidate: SummaryCandidate;
  relation: SummaryNodeView['relation'];
}> {
  const parents: SummaryCandidate[] = [];
  let parentPath = params.target.parentPath;

  while (parentPath !== null && parents.length < params.parentDepth) {
    const parent = params.candidates.find((value) => value.path === parentPath);

    if (!parent) {
      break;
    }

    parents.unshift(parent);
    parentPath = parent.parentPath;
  }

  const children: SummaryCandidate[] = [];
  function addChildren(parent: SummaryCandidate, depth: number): void {
    if (depth <= 0) {
      return;
    }

    for (const child of directChildren(params.candidates, parent.path)) {
      children.push(child);
      addChildren(child, depth - 1);
    }
  }

  addChildren(params.target, params.childDepth);

  return [
    ...parents.map((candidate) => ({
      candidate,
      relation: 'parent' as const,
    })),
    { candidate: params.target, relation: 'current' as const },
    ...children.map((candidate) => ({
      candidate,
      relation: 'child' as const,
    })),
  ];
}

function nodeView(params: {
  candidates: SummaryCandidate[];
  candidate: SummaryCandidate;
  relation: SummaryNodeView['relation'];
  requestedFile: string | null;
  summaryValid: boolean;
  enrichmentValid: boolean;
}): SummaryNodeView {
  const { candidate, relation } = params;
  const index = candidate.index;

  const fileNames =
    relation === 'parent'
      ? []
      : params.requestedFile !== null
        ? [params.requestedFile]
        : Object.keys(candidate.fileHashes).sort((a, b) => a.localeCompare(b));

  return {
    path: candidate.path,
    relation,
    sourceStatus: candidate.sourceStatus,
    summaryStatus:
      index?.summary === null || index?.summary === undefined
        ? 'missing'
        : params.summaryValid
          ? 'current'
          : 'stale',
    enrichmentStatus:
      index?.enrichment === null || index?.enrichment === undefined
        ? 'missing'
        : params.enrichmentValid
          ? 'current'
          : 'stale',
    summary: params.summaryValid ? (index?.summary?.value ?? null) : null,
    sourceSummary:
      candidate.sourceStatus === 'current'
        ? (index?.source.directorySummary ?? null)
        : null,
    enrichedSummary: params.enrichmentValid
      ? (index?.enrichment?.directorySummary ?? null)
      : null,
    coverage:
      index === null ? null : expectedCoverage(params.candidates, candidate),
    files: fileNames.map((name) => {
      const record = index?.source.files[name];
      const currentHash = candidate.fileHashes[name];

      const status =
        currentHash === undefined || record === undefined
          ? 'missing'
          : record.hash === currentHash
            ? 'current'
            : 'stale';

      const path = candidate.path === '.' ? name : `${candidate.path}/${name}`;

      return {
        path,
        status,
        sourceSummary:
          status === 'current' ? (record?.sourceSummary ?? null) : null,
        enrichedSummary:
          status === 'current' && params.enrichmentValid
            ? (index?.enrichment?.files[name] ?? null)
            : null,
      };
    }),
  };
}

export function readBottomupSummary(params: {
  workspaceRoot: string;
  call: BottomupSummaryCall;
}): SummaryProjection {
  const options = normalizeOptions(params.call);
  const target = resolveTarget(params.workspaceRoot, options.path);

  const root = resolveGenerateRoot({
    workspaceRoot: params.workspaceRoot,
    targetAbsolute: target.directoryAbsolute,
    explicitRoot: options.root,
  });

  const candidates = collectCandidates({
    workspaceRoot: params.workspaceRoot,
    rootAbsolute: root.absolutePath,
  });

  const targetPath = workspaceRelative(
    params.workspaceRoot,
    target.directoryAbsolute,
  );

  const targetCandidate = candidates.find((value) => value.path === targetPath);

  if (!targetCandidate) {
    throw new Error(
      `Path is outside the resolved bottom-up root: ${options.path}`,
    );
  }

  const summaryValid = summaryValidity(candidates);
  const enrichmentValid = enrichmentValidity(candidates);

  const selected = selectedCandidates({
    candidates,
    target: targetCandidate,
    parentDepth: options.parentDepth,
    childDepth: target.requestedFile === null ? options.childDepth : 0,
  });

  const warnings =
    root.source === 'workspace fallback'
      ? ['No marked bottom-up root was found; using workspace root.']
      : [];

  return {
    path: target.relativePath,
    root: root.relativePath,
    rootSource: root.source,
    requestedFile: target.requestedFile,
    parentDepth: options.parentDepth,
    childDepth: options.childDepth,
    nodes: selected.map(({ candidate, relation }) =>
      nodeView({
        candidates,
        candidate,
        relation,
        requestedFile: relation === 'current' ? target.requestedFile : null,
        summaryValid: summaryValid.get(candidate.path) === true,
        enrichmentValid: enrichmentValid.get(candidate.path) === true,
      }),
    ),
    warnings,
  };
}

function markdownNode(node: SummaryNodeView, headingLevel: number): string[] {
  const heading = '#'.repeat(Math.min(6, headingLevel));
  const sectionHeading = '#'.repeat(Math.min(6, headingLevel + 1));

  const lines = [
    `${heading} ${node.path}`,
    `Status: source=${node.sourceStatus}, summary=${node.summaryStatus}, enrichment=${node.enrichmentStatus}`,
  ];

  if (node.summary) {
    lines.push('', `${sectionHeading} Summary`, node.summary);
  }

  if (node.sourceSummary) {
    lines.push('', `${sectionHeading} Source`, node.sourceSummary);
  }

  if (node.enrichedSummary) {
    lines.push(
      '',
      `${sectionHeading} Role in the System`,
      node.enrichedSummary,
    );
  }

  if (node.coverage && !node.coverage.complete) {
    lines.push(
      '',
      `Coverage: incomplete (${node.coverage.missing.length} missing, ${node.coverage.stale.length} stale)`,
    );
  }

  if (node.files.length > 0) {
    lines.push('', `${sectionHeading} Files`);
    for (const file of node.files) {
      lines.push(`- **${file.path}** (${file.status})`);

      if (file.sourceSummary) {
        lines.push(`  Source: ${file.sourceSummary}`);
      }

      if (file.enrichedSummary) {
        lines.push(`  Role: ${file.enrichedSummary}`);
      }
    }
  }

  return lines;
}

export function formatBottomupSummary(
  projection: SummaryProjection,
  format: 'markdown' | 'json',
): string {
  if (format === 'json') {
    return `${JSON.stringify(projection, null, 2)}\n`;
  }

  const firstDepth = pathDepth(projection.nodes[0]?.path ?? '.');

  return [
    '# Bottom-up Summary',
    '',
    `Requested path: ${projection.path}`,
    `Resolved root: ${projection.root} (${projection.rootSource})`,
    ...projection.warnings.map((warning) => `Warning: ${warning}`),
    '',
    ...projection.nodes.flatMap((node, index) => {
      const headingLevel = 2 + Math.max(0, pathDepth(node.path) - firstDepth);

      return [
        ...(index === 0 ? [] : ['']),
        ...markdownNode(node, headingLevel),
      ];
    }),
  ].join('\n');
}

function pathDepth(path: string): number {
  return path === '.' ? 0 : path.split('/').filter(Boolean).length;
}

export function executeBottomupSummary(params: {
  workspaceRoot: string;
  call: BottomupSummaryCall;
}): string {
  const projection = readBottomupSummary(params);

  const content = formatBottomupSummary(
    projection,
    params.call.format ?? 'markdown',
  );

  if (params.call.location !== null) {
    const location = saveBottomupSummary({
      workspaceRoot: params.workspaceRoot,
      location: params.call.location,
      content,
    });

    return `Saved bottom-up summary projection: ${location}`;
  }

  return content;
}

export function defaultSummaryLocation(params: {
  projection: SummaryProjection;
  format: 'markdown' | 'json';
}): string {
  const directory =
    params.projection.requestedFile === null
      ? params.projection.path
      : toPosix(dirname(params.projection.path));

  const fileName =
    params.format === 'json' ? 'BOTTOMUP_SUMMARY.json' : 'BOTTOMUP_SUMMARY.md';

  return directory === '.' ? fileName : `${directory}/${fileName}`;
}

export function saveBottomupSummary(params: {
  workspaceRoot: string;
  location: string;
  content: string;
}): string {
  const location = params.location.trim();

  if (location.length === 0 || isAbsolute(location)) {
    throw new Error('Summary export location must be workspace-relative.');
  }

  const workspaceRoot = resolve(params.workspaceRoot);
  const absolutePath = resolve(workspaceRoot, location);
  const underWorkspace = relative(workspaceRoot, absolutePath);

  if (underWorkspace === '..' || underWorkspace.startsWith(`..${sep}`)) {
    throw new Error('Summary export location escapes the workspace.');
  }

  if (basename(absolutePath) === '.BOTTOMUP.json') {
    throw new Error('Summary exports cannot overwrite the canonical index.');
  }

  if (
    !existsSync(dirname(absolutePath)) ||
    !statSync(dirname(absolutePath)).isDirectory()
  ) {
    throw new Error(
      `Summary export parent directory does not exist: ${dirname(location)}`,
    );
  }

  if (existsSync(absolutePath) && statSync(absolutePath).isDirectory()) {
    throw new Error(`Summary export location is a directory: ${location}`);
  }

  const temporaryPath = `${absolutePath}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, params.content, 'utf8');
  renameSync(temporaryPath, absolutePath);

  return workspaceRelative(workspaceRoot, absolutePath);
}

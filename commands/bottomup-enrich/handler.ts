import { existsSync, readFileSync } from 'fs';
import { basename, dirname, join, relative } from 'path';

import {
  BottomupEnrichCallSchema,
  type BottomupEnrichCall,
} from '../../ai/schema';

import {
  createGenerateFilter,
  directFileHashes,
  hashText,
  hashValue,
  listGenerateEntries,
  readIndex,
  resolveDirectory,
  resolveGenerateRoot,
  serializeIndex,
  toPosix,
  workspaceRelative,
  writeIndex,
} from '../bottomup-generate/fs';
import type { GeneratePrompt } from '../bottomup-generate/types';
import {
  BOTTOMUP_ENRICHMENT_VERSION,
  BOTTOMUP_INDEX_FILE,
  BOTTOMUP_SOURCE_VERSION,
  BottomupIndexSchema,
  type BottomupIndex,
} from '../bottomup-generate/types';
import { computeSummaryHash } from '../bottomup-summarize/hash';
import { readBottomupSummary } from '../bottomup-summary/handler';
import { createUnifiedDiff } from '../shared/unified-diff';

import { runEnrichAgent } from './ai';
import {
  EnrichDraftStateSchema,
  type EnrichCandidate,
  type EnrichDraftState,
  type EnrichPlan,
  type EnrichResolvedOptions,
  type EnrichResult,
} from './types';

function normalizeOptions(call: BottomupEnrichCall): EnrichResolvedOptions {
  return {
    path: call.path,
    root: call.root,
    respectGitignore: call.respect_gitignore ?? true,
    includeHidden: call.include_hidden ?? false,
    extraIgnore: call.extra_ignore ?? [],
    model: call.model,
    prompt: call.prompt,
    context: call.context,
    allowPartial: call.allow_partial ?? false,
    force: call.force ?? false,
    draft: call.draft ?? false,
    plan: call.plan ?? false,
    agentContext:
      call.agent_context === null
        ? null
        : {
            context: call.agent_context.context,
            files: Object.fromEntries(
              Object.entries(call.agent_context.files).map(([path, value]) => [
                path,
                { enrichedSummary: value.enriched_summary ?? undefined },
              ]),
            ),
            directories: Object.fromEntries(
              Object.entries(call.agent_context.directories).map(
                ([path, value]) => [
                  path,
                  { enrichedSummary: value.enriched_summary ?? undefined },
                ],
              ),
            ),
          },
  };
}

function validateOptions(
  options: EnrichResolvedOptions,
  draftAllowed: boolean,
): void {
  if (options.draft && !draftAllowed) {
    throw new Error('--draft is only available through the web interface.');
  }
}

function sourceInputHash(fileHashes: Record<string, string>): string {
  return hashValue({ version: BOTTOMUP_SOURCE_VERSION, files: fileHashes });
}

function indexFileHash(directoryPath: string): string | null {
  const filePath = join(directoryPath, BOTTOMUP_INDEX_FILE);

  return existsSync(filePath) ? hashText(readFileSync(filePath)) : null;
}

function collectCandidates(params: {
  workspaceRoot: string;
  rootAbsolute: string;
  targetAbsolute: string;
  options: EnrichResolvedOptions;
}): EnrichCandidate[] {
  const targetRelativeToRoot =
    toPosix(relative(params.rootAbsolute, params.targetAbsolute)) || '.';

  const filter = createGenerateFilter({
    rootAbsolute: params.rootAbsolute,
    respectGitignore: params.options.respectGitignore,
    includeHidden: params.options.includeHidden,
    extraIgnore: params.options.extraIgnore,
    targetRelativeToRoot,
  });

  const candidates: EnrichCandidate[] = [];

  function visit(
    absolutePath: string,
    parentPath: string | null,
    parentCurrent: boolean,
  ): void {
    const path = workspaceRelative(params.workspaceRoot, absolutePath);

    const entries = listGenerateEntries({
      rootAbsolute: params.rootAbsolute,
      directoryAbsolute: absolutePath,
      filter,
    });

    const currentSourceInputHash = sourceInputHash(
      directFileHashes(entries.files),
    );

    const index = readIndex(absolutePath);

    const ownStatus =
      index === null
        ? 'missing'
        : index.source.inputHash !== currentSourceInputHash
          ? 'stale'
          : 'current';

    const status =
      parentCurrent || ownStatus !== 'current' ? ownStatus : 'blocked';

    const current = status === 'current';

    candidates.push({
      absolutePath,
      path,
      status,
      index,
      currentSourceInputHash,
      parentPath,
    });

    for (const child of entries.directories) {
      visit(child.absolutePath, path, current);
    }
  }

  visit(params.targetAbsolute, null, true);

  return candidates;
}

function findSavedContext(params: {
  targetAbsolute: string;
  rootAbsolute: string;
}): string | null {
  let cursor = params.targetAbsolute;

  while (true) {
    const index = readIndex(cursor);

    if (index?.context?.value) {
      return index.context.value;
    }

    if (cursor === params.rootAbsolute) {
      return null;
    }

    const parent = dirname(cursor);

    if (parent === cursor) {
      return null;
    }

    cursor = parent;
  }
}

function enrichInputHash(
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

function relevantKnowledge(
  options: EnrichResolvedOptions,
  directoryPath: string,
) {
  return {
    directory: options.agentContext?.directories[directoryPath] ?? null,
    file(path: string) {
      return options.agentContext?.files[path] ?? null;
    },
  };
}

function coverage(
  candidates: EnrichCandidate[],
  summaryStatuses: Map<string, 'current' | 'missing' | 'stale'>,
) {
  return {
    missing: candidates
      .filter((candidate) => candidate.status === 'missing')
      .map((candidate) => candidate.path),
    stale: candidates
      .filter((candidate) => candidate.status === 'stale')
      .map((candidate) => candidate.path),
    blocked: candidates
      .filter((candidate) => candidate.status === 'blocked')
      .map((candidate) => candidate.path),
    missingSummaries: candidates
      .filter(
        (candidate) =>
          (candidate.status === 'current' || candidate.status === 'blocked') &&
          summaryStatuses.get(candidate.path) === 'missing',
      )
      .map((candidate) => candidate.path),
    staleSummaries: candidates
      .filter(
        (candidate) =>
          (candidate.status === 'current' || candidate.status === 'blocked') &&
          summaryStatuses.get(candidate.path) === 'stale',
      )
      .map((candidate) => candidate.path),
  };
}

function assertCoverage(
  candidates: EnrichCandidate[],
  summaryStatuses: Map<string, 'current' | 'missing' | 'stale'>,
  allowPartial: boolean,
): void {
  if (allowPartial) {
    return;
  }

  const invalid = coverage(candidates, summaryStatuses);

  if (
    invalid.missing.length === 0 &&
    invalid.stale.length === 0 &&
    invalid.blocked.length === 0 &&
    invalid.missingSummaries.length === 0 &&
    invalid.staleSummaries.length === 0
  ) {
    return;
  }

  throw new Error(
    [
      'Enrichment requires complete, current generated coverage.',
      ...invalid.missing.map((path) => `missing: ${path}`),
      ...invalid.stale.map((path) => `stale: ${path}`),
      ...invalid.blocked.map((path) => `blocked: ${path}`),
      ...invalid.missingSummaries.map((path) => `missing summary: ${path}`),
      ...invalid.staleSummaries.map((path) => `stale summary: ${path}`),
      'Run bottomup.generate and bottomup.summarize first, or pass --allow-partial.',
    ].join('\n'),
  );
}

function encodeState(state: EnrichDraftState): string {
  return Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');
}

function decodeState(value: string): EnrichDraftState {
  try {
    return EnrichDraftStateSchema.parse(
      JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown,
    );
  } catch {
    throw new Error('Invalid or expired bottom-up enrichment draft state.');
  }
}

async function processEnrichment(params: {
  workspaceRoot: string;
  rootAbsolute: string;
  candidates: EnrichCandidate[];
  options: EnrichResolvedOptions;
  summaryStatuses: Map<string, 'current' | 'missing' | 'stale'>;
  initialContext: string;
  runPrompt?: GeneratePrompt;
  sessionIds?: Record<string, string>;
}): Promise<{
  proposed: Map<string, BottomupIndex>;
  updated: string[];
  skipped: string[];
  sessions: Record<string, string>;
  aiCalls: number;
}> {
  const proposed = new Map<string, BottomupIndex>();
  const effectiveContexts = new Map<string, string>();
  const broadContexts = new Map<string, string>();

  const broadOrigins = new Map<
    string,
    NonNullable<BottomupIndex['context']>['origin']
  >();

  const updated: string[] = [];
  const skipped: string[] = [];
  const sessions: Record<string, string> = {};
  let aiCalls = 0;

  for (const candidate of params.candidates) {
    if (
      candidate.status !== 'current' ||
      candidate.index === null ||
      params.summaryStatuses.get(candidate.path) !== 'current'
    ) {
      continue;
    }

    const broadContext =
      candidate.parentPath === null
        ? params.initialContext
        : broadContexts.get(candidate.parentPath);

    const parentContext =
      candidate.parentPath === null
        ? broadContext
        : effectiveContexts.get(candidate.parentPath);

    if (broadContext === undefined || parentContext === undefined) {
      continue;
    }

    const index = candidate.index;
    const compactSummary = index.summary;

    if (compactSummary === null) {
      continue;
    }

    const broadOrigin =
      candidate.parentPath === null
        ? params.options.context !== null
          ? ('user' as const)
          : params.options.agentContext?.context != null
            ? ('agent' as const)
            : index.context?.value === broadContext
              ? index.context.origin
              : compactSummary.provenance === 'agent'
                ? ('agent' as const)
                : ('ai' as const)
        : broadOrigins.get(candidate.parentPath);

    if (broadOrigin === undefined) {
      continue;
    }

    const knowledge = relevantKnowledge(params.options, index.path);

    const expectedInputHash = enrichInputHash(
      candidate.currentSourceInputHash!,
      computeSummaryHash(compactSummary),
      parentContext,
    );

    const hasAgentChanges =
      knowledge.directory !== null ||
      Object.keys(index.source.files).some((name) => {
        const path = index.path === '.' ? name : `${index.path}/${name}`;

        return knowledge.file(path) !== null;
      });

    const current =
      !params.options.force &&
      params.options.prompt === null &&
      !hasAgentChanges &&
      index.enrichment !== null &&
      index.enrichment.inputHash === expectedInputHash;

    if (current) {
      proposed.set(candidate.path, index);
      broadContexts.set(candidate.path, index.context?.value ?? broadContext);
      broadOrigins.set(candidate.path, index.context?.origin ?? broadOrigin);
      effectiveContexts.set(candidate.path, childEffectiveContext(index));
      skipped.push(candidate.path);
      continue;
    }

    const suppliedDirectory = knowledge.directory?.enrichedSummary ?? null;

    const canAvoidAi =
      params.options.prompt === null && suppliedDirectory !== null;

    let directoryEnrichment = suppliedDirectory;
    const fileEnrichments: Record<string, string> = {};

    if (canAvoidAi) {
      for (const name of Object.keys(index.source.files)) {
        const path = index.path === '.' ? name : `${index.path}/${name}`;
        const supplied = knowledge.file(path)?.enrichedSummary;

        if (supplied !== undefined) {
          fileEnrichments[name] = supplied;
        }
      }
    } else {
      const childSummaries = params.candidates
        .filter((value) => value.parentPath === candidate.path)
        .flatMap((childCandidate) => {
          const childIndex = childCandidate?.index;

          return childIndex === null ||
            childIndex === undefined ||
            params.summaryStatuses.get(childCandidate.path) !== 'current' ||
            childIndex.summary === null
            ? []
            : [
                {
                  name: basename(childCandidate.absolutePath),
                  path: childCandidate.path,
                  summary: childIndex.summary!.value,
                },
              ];
        });

      const execution = await runEnrichAgent({
        runPrompt: params.runPrompt,
        cwd: params.workspaceRoot,
        model: params.options.model,
        sessionId: params.sessionIds?.[candidate.path] ?? null,
        directoryPath: candidate.path,
        prompt: params.options.prompt,
        context: parentContext,
        directorySourceSummary: index.source.directorySummary,
        directoryCompactSummary: compactSummary.value,
        files: Object.entries(index.source.files).map(([name, file]) => {
          const path = index.path === '.' ? name : `${index.path}/${name}`;

          return {
            name,
            path,
            sourceSummary: file.sourceSummary,
            suppliedEnrichedSummary:
              knowledge.file(path)?.enrichedSummary ?? null,
          };
        }),
        children: childSummaries,
        suppliedDirectoryEnrichedSummary: suppliedDirectory,
      });

      aiCalls++;
      sessions[candidate.path] = execution.sessionId;
      directoryEnrichment = execution.response.directory_enriched_summary;
      for (const file of execution.response.files) {
        if (file.enriched_summary !== null) {
          fileEnrichments[file.name] = file.enriched_summary;
        }
      }
    }

    if (directoryEnrichment === null) {
      throw new Error(
        `Enrichment omitted directory role for ${candidate.path}.`,
      );
    }

    const next: BottomupIndex = {
      ...index,
      context: {
        value: broadContext,
        origin: broadOrigin,
        hash: hashValue({ value: broadContext }),
      },
      enrichment: {
        inputHash: expectedInputHash,
        summaryHash: computeSummaryHash(compactSummary),
        directorySummary: directoryEnrichment,
        files: fileEnrichments,
        provenance: canAvoidAi ? 'agent' : 'ai',
      },
    };

    proposed.set(candidate.path, next);
    broadContexts.set(candidate.path, broadContext);
    broadOrigins.set(candidate.path, broadOrigin);
    effectiveContexts.set(candidate.path, childEffectiveContext(next));
    updated.push(candidate.path);
  }

  return { proposed, updated, skipped, sessions, aiCalls };
}

function buildPlan(params: {
  workspaceRoot: string;
  root: ReturnType<typeof resolveGenerateRoot>;
  candidates: EnrichCandidate[];
  options: EnrichResolvedOptions;
  initialContext: string | null;
  summaryStatuses: Map<string, 'current' | 'missing' | 'stale'>;
}): EnrichPlan {
  const invalid = coverage(params.candidates, params.summaryStatuses);
  const warnings: string[] = [];

  if (params.root.source === 'workspace fallback') {
    warnings.push('No marked root was found; using workspace root.');
  }

  if (params.initialContext === null) {
    warnings.push(
      'No explicit, saved, or current compact-summary context is available.',
    );
  }

  if (
    !params.options.allowPartial &&
    (invalid.missing.length > 0 ||
      invalid.stale.length > 0 ||
      invalid.blocked.length > 0 ||
      invalid.missingSummaries.length > 0 ||
      invalid.staleSummaries.length > 0)
  ) {
    warnings.push('Strict enrichment is blocked by incomplete coverage.');
  }

  const strictBlocked =
    !params.options.allowPartial &&
    (invalid.missing.length > 0 ||
      invalid.stale.length > 0 ||
      invalid.blocked.length > 0 ||
      invalid.missingSummaries.length > 0 ||
      invalid.staleSummaries.length > 0);

  let expectedAiCalls = 0;
  const affectedFiles: string[] = [];
  const effectiveContexts = new Map<string, string>();
  const changedByPath = new Map<string, boolean>();

  for (const candidate of strictBlocked ? [] : params.candidates) {
    if (
      candidate.status !== 'current' ||
      candidate.index === null ||
      params.summaryStatuses.get(candidate.path) !== 'current'
    ) {
      changedByPath.set(candidate.path, true);
      continue;
    }

    const context =
      candidate.parentPath === null
        ? params.initialContext
        : effectiveContexts.get(candidate.parentPath);

    if (context === null || context === undefined) {
      continue;
    }

    const knowledge = relevantKnowledge(params.options, candidate.path);

    const expectedHash = enrichInputHash(
      candidate.currentSourceInputHash!,
      computeSummaryHash(candidate.index.summary!),
      context,
    );

    const hasAgentChanges =
      knowledge.directory !== null ||
      Object.keys(candidate.index.source.files).some((name) => {
        const path =
          candidate.path === '.' ? name : `${candidate.path}/${name}`;

        return knowledge.file(path) !== null;
      });

    const current =
      candidate.index.enrichment !== null &&
      candidate.index.enrichment.inputHash === expectedHash;

    const parentChanged =
      candidate.parentPath === null
        ? false
        : (changedByPath.get(candidate.parentPath) ?? true);

    const needsUpdate =
      parentChanged ||
      params.options.force ||
      params.options.prompt !== null ||
      hasAgentChanges ||
      !current;

    const canAvoidAi =
      params.options.prompt === null &&
      knowledge.directory?.enrichedSummary !== undefined;

    const needsAi = needsUpdate && !canAvoidAi;

    if (needsUpdate) {
      affectedFiles.push(
        workspaceRelative(
          params.workspaceRoot,
          join(candidate.absolutePath, BOTTOMUP_INDEX_FILE),
        ),
      );
    }

    if (needsAi) {
      expectedAiCalls++;
    }

    changedByPath.set(candidate.path, needsUpdate);

    effectiveContexts.set(
      candidate.path,
      childEffectiveContext(candidate.index),
    );
  }

  return {
    path: workspaceRelative(
      params.workspaceRoot,
      params.candidates[0]!.absolutePath,
    ),
    root: params.root.relativePath,
    rootSource: params.root.source,
    complete:
      invalid.missing.length === 0 &&
      invalid.stale.length === 0 &&
      invalid.blocked.length === 0 &&
      invalid.missingSummaries.length === 0 &&
      invalid.staleSummaries.length === 0,
    currentDirectories: params.candidates.filter(
      (candidate) => candidate.status === 'current',
    ).length,
    ...invalid,
    expectedAiCalls,
    affectedFiles,
    warnings,
  };
}

export async function executeBottomupEnrich(params: {
  workspaceRoot: string;
  call: BottomupEnrichCall;
  draftAllowed?: boolean;
  runPrompt?: GeneratePrompt;
  sessionIds?: Record<string, string>;
}): Promise<EnrichResult> {
  const options = normalizeOptions(params.call);
  validateOptions(options, params.draftAllowed ?? false);
  const target = resolveDirectory(params.workspaceRoot, options.path);

  const root = resolveGenerateRoot({
    workspaceRoot: params.workspaceRoot,
    targetAbsolute: target.absolutePath,
    explicitRoot: options.root,
  });

  const candidates = collectCandidates({
    workspaceRoot: params.workspaceRoot,
    rootAbsolute: root.absolutePath,
    targetAbsolute: target.absolutePath,
    options,
  });

  const summaryProjection = readBottomupSummary({
    workspaceRoot: params.workspaceRoot,
    call: {
      type: 'bottomup.summary',
      path: target.relativePath,
      root: root.relativePath,
      format: 'json',
      parent_depth: Number.MAX_SAFE_INTEGER,
      child_depth: Number.MAX_SAFE_INTEGER,
      location: null,
      draft: false,
    },
  });

  const summaryStatuses = new Map(
    summaryProjection.nodes.map((node) => [node.path, node.summaryStatus]),
  );

  const summaryContext =
    summaryProjection.nodes.find(
      (node) =>
        node.relation === 'parent' &&
        node.summaryStatus === 'current' &&
        node.summary !== null,
    )?.summary ??
    summaryProjection.nodes.find(
      (node) =>
        node.relation === 'current' &&
        node.summaryStatus === 'current' &&
        node.summary !== null,
    )?.summary ??
    null;

  const initialContext =
    options.context ??
    options.agentContext?.context ??
    findSavedContext({
      targetAbsolute: target.absolutePath,
      rootAbsolute: root.absolutePath,
    }) ??
    summaryContext;

  if (options.plan) {
    return {
      type: 'plan',
      plan: buildPlan({
        workspaceRoot: params.workspaceRoot,
        root,
        candidates,
        options,
        initialContext,
        summaryStatuses,
      }),
    };
  }

  assertCoverage(candidates, summaryStatuses, options.allowPartial);

  if (initialContext === null) {
    throw new Error(
      `No context or current compact summary is available to enrich ${target.relativePath}. Pass --context or run bottomup.summarize first.`,
    );
  }

  const invalid = coverage(candidates, summaryStatuses);

  const processed = await processEnrichment({
    workspaceRoot: params.workspaceRoot,
    rootAbsolute: root.absolutePath,
    candidates,
    options,
    summaryStatuses,
    initialContext,
    runPrompt: params.runPrompt,
    sessionIds: params.sessionIds,
  });

  if (options.draft) {
    const baseHashes: Record<string, string | null> = {};
    const proposedFiles: Record<string, string> = {};
    const diffs: string[] = [];
    for (const [path, index] of processed.proposed) {
      if (!processed.updated.includes(path)) {
        continue;
      }

      const candidate = candidates.find((value) => value.path === path)!;

      const filePath = workspaceRelative(
        params.workspaceRoot,
        join(candidate.absolutePath, BOTTOMUP_INDEX_FILE),
      );

      const existing = readFileSync(
        join(candidate.absolutePath, BOTTOMUP_INDEX_FILE),
        'utf8',
      );

      const proposed = serializeIndex(index);
      baseHashes[filePath] = indexFileHash(candidate.absolutePath);
      proposedFiles[filePath] = proposed;

      diffs.push(
        createUnifiedDiff({ relativePath: filePath, existing, proposed }),
      );
    }

    return {
      type: 'draft',
      root: root.relativePath,
      updated: processed.updated,
      skipped: processed.skipped,
      ...invalid,
      aiCalls: processed.aiCalls,
      diff: diffs.join('\n\n'),
      state: encodeState({
        version: 1,
        call: params.call,
        baseHashes,
        proposedFiles,
        agentSessionIds: processed.sessions,
      }),
    };
  }

  for (const path of processed.updated) {
    const candidate = candidates.find((value) => value.path === path)!;

    writeIndex(
      candidate.absolutePath,
      serializeIndex(processed.proposed.get(path)!),
    );
  }

  return {
    type: 'written',
    root: root.relativePath,
    updated: processed.updated,
    skipped: processed.skipped,
    ...invalid,
    aiCalls: processed.aiCalls,
  };
}

export async function reviseBottomupEnrichDraft(params: {
  workspaceRoot: string;
  state: string;
  prompt: string;
  runPrompt?: GeneratePrompt;
}): Promise<Extract<EnrichResult, { type: 'draft' }>> {
  const state = decodeState(params.state);
  const call = BottomupEnrichCallSchema.parse(state.call);
  const files: Record<string, { enriched_summary?: string }> = {};
  const directories: Record<string, { enriched_summary?: string }> = {};
  let context: string | null = null;

  for (const serialized of Object.values(state.proposedFiles)) {
    const index = BottomupIndexSchema.parse(JSON.parse(serialized) as unknown);
    context ??= index.context?.value ?? null;

    directories[index.path] = {
      enriched_summary: index.enrichment?.directorySummary,
    };

    for (const [name, summary] of Object.entries(
      index.enrichment?.files ?? {},
    )) {
      files[index.path === '.' ? name : `${index.path}/${name}`] = {
        enriched_summary: summary,
      };
    }
  }

  const result = await executeBottomupEnrich({
    workspaceRoot: params.workspaceRoot,
    draftAllowed: true,
    runPrompt: params.runPrompt,
    sessionIds: state.agentSessionIds,
    call: {
      ...call,
      draft: true,
      plan: false,
      force: true,
      prompt: params.prompt,
      context: context ?? call.context,
      agent_context: {
        context,
        files,
        directories,
      },
    },
  });

  if (result.type !== 'draft') {
    throw new Error('Revision did not produce an enrichment draft.');
  }

  return result;
}

export function acceptBottomupEnrichDraft(params: {
  workspaceRoot: string;
  state: string;
}): { files: string[] } {
  const state = decodeState(params.state);
  const call = BottomupEnrichCallSchema.parse(state.call);
  const target = resolveDirectory(params.workspaceRoot, call.path);

  const root = resolveGenerateRoot({
    workspaceRoot: params.workspaceRoot,
    targetAbsolute: target.absolutePath,
    explicitRoot: call.root,
  });

  const parsed: Array<{
    filePath: string;
    directoryAbsolute: string;
    index: BottomupIndex;
  }> = [];

  for (const [filePath, serialized] of Object.entries(state.proposedFiles)) {
    const directoryRelative = dirname(filePath);
    const directory = resolveDirectory(params.workspaceRoot, directoryRelative);

    const expected = workspaceRelative(
      params.workspaceRoot,
      join(directory.absolutePath, BOTTOMUP_INDEX_FILE),
    );

    if (expected !== filePath) {
      throw new Error(`Draft path is invalid: ${filePath}`);
    }

    if (indexFileHash(directory.absolutePath) !== state.baseHashes[filePath]) {
      throw new Error(
        `Cannot accept enrichment draft: ${filePath} changed during review.`,
      );
    }

    const index = BottomupIndexSchema.parse(JSON.parse(serialized) as unknown);

    if (index.path !== directory.relativePath) {
      throw new Error(`Draft metadata does not match ${filePath}.`);
    }

    const entries = Object.fromEntries(
      Object.entries(index.source.files).map(([name, file]) => [
        name,
        file.hash,
      ]),
    );

    const actual = directFileHashes(
      listGenerateEntries({
        rootAbsolute: root.absolutePath,
        directoryAbsolute: directory.absolutePath,
        filter: createGenerateFilter({
          rootAbsolute: root.absolutePath,
          respectGitignore: call.respect_gitignore ?? true,
          includeHidden: call.include_hidden ?? false,
          extraIgnore: call.extra_ignore ?? [],
          targetRelativeToRoot:
            toPosix(relative(root.absolutePath, directory.absolutePath)) || '.',
        }),
      }).files,
    );

    if (JSON.stringify(entries) !== JSON.stringify(actual)) {
      throw new Error(
        `Cannot accept enrichment draft: source changed under ${directoryRelative}.`,
      );
    }

    parsed.push({
      filePath,
      directoryAbsolute: directory.absolutePath,
      index,
    });
  }

  for (const item of parsed) {
    writeIndex(item.directoryAbsolute, serializeIndex(item.index));
  }

  return { files: parsed.map((item) => item.filePath) };
}

export function formatEnrichResult(result: EnrichResult): string {
  if (result.type === 'plan') {
    return [
      'Operation: bottomup.enrich',
      `Path: ${result.plan.path}`,
      `Resolved root: ${result.plan.root}`,
      `Root source: ${result.plan.rootSource}`,
      `Coverage: ${result.plan.complete ? 'complete' : 'incomplete'}`,
      `Current directories: ${result.plan.currentDirectories}`,
      `Missing: ${result.plan.missing.length}`,
      `Stale: ${result.plan.stale.length}`,
      `Blocked: ${result.plan.blocked.length}`,
      `Missing summaries: ${result.plan.missingSummaries.length}`,
      `Stale summaries: ${result.plan.staleSummaries.length}`,
      `AI enrichment calls: up to ${result.plan.expectedAiCalls}`,
      `Proposed JSON files: ${result.plan.affectedFiles.length}`,
      ...result.plan.affectedFiles.map((path) => `  ${path}`),
      ...result.plan.warnings.map((warning) => `Warning: ${warning}`),
    ].join('\n');
  }

  if (result.type === 'draft') {
    return [
      `Enrichment draft: ${result.updated.length} updated, ${result.skipped.length} skipped.`,
      `AI calls: ${result.aiCalls}`,
      '',
      result.diff,
    ].join('\n');
  }

  return [
    `Enriched ${result.updated.length}, skipped ${result.skipped.length}.`,
    `Resolved root: ${result.root}`,
    `AI calls: ${result.aiCalls}`,
    ...result.updated.map((path) => `enriched: ${path}`),
    ...result.skipped.map((path) => `skipped: ${path}`),
    ...result.missing.map((path) => `missing: ${path}`),
    ...result.stale.map((path) => `stale: ${path}`),
    ...result.blocked.map((path) => `blocked: ${path}`),
    ...result.missingSummaries.map((path) => `missing summary: ${path}`),
    ...result.staleSummaries.map((path) => `stale summary: ${path}`),
  ].join('\n');
}

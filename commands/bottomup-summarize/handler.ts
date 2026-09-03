import { existsSync, readFileSync } from 'fs';
import { dirname, join, relative, sep } from 'path';

import {
  BottomupSummarizeCallSchema,
  type BottomupSummarizeCall,
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
import {
  BOTTOMUP_INDEX_FILE,
  BOTTOMUP_SOURCE_VERSION,
  BOTTOMUP_SUMMARY_VERSION,
  BottomupIndexSchema,
  type BottomupIndex,
  type GeneratePrompt,
} from '../bottomup-generate/types';
import { createUnifiedDiff } from '../shared/unified-diff';

import { runSummarizeAgent } from './ai';
import { computeSummaryInputHash } from './hash';
import {
  SummarizeDraftStateSchema,
  type SummarizeCandidate,
  type SummarizeDraftState,
  type SummarizePlan,
  type SummarizeResolvedOptions,
  type SummarizeResult,
} from './types';

function normalizeOptions(
  call: BottomupSummarizeCall,
): SummarizeResolvedOptions {
  return {
    path: call.path,
    root: call.root,
    respectGitignore: call.respect_gitignore ?? true,
    includeHidden: call.include_hidden ?? false,
    extraIgnore: call.extra_ignore ?? [],
    model: call.model,
    prompt: call.prompt,
    noPartial: call.no_partial ?? false,
    draft: call.draft ?? false,
    plan: call.plan ?? false,
    agentContext:
      call.agent_context === null
        ? null
        : {
            directories: Object.fromEntries(
              Object.entries(call.agent_context.directories).map(
                ([path, value]) => [
                  path,
                  { sourceSummary: value.source_summary ?? undefined },
                ],
              ),
            ),
          },
  };
}

function validateOptions(
  options: SummarizeResolvedOptions,
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
  options: SummarizeResolvedOptions;
}): SummarizeCandidate[] {
  const targetRelativeToRoot =
    toPosix(relative(params.rootAbsolute, params.targetAbsolute)) || '.';

  const filter = createGenerateFilter({
    rootAbsolute: params.rootAbsolute,
    respectGitignore: params.options.respectGitignore,
    includeHidden: params.options.includeHidden,
    extraIgnore: params.options.extraIgnore,
    targetRelativeToRoot,
  });

  const candidates: SummarizeCandidate[] = [];

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

    const index = readIndex(absolutePath);
    const expectedSourceHash = sourceInputHash(directFileHashes(entries.files));

    candidates.push({
      absolutePath,
      path,
      status:
        index === null
          ? 'missing'
          : index.source.inputHash === expectedSourceHash
            ? 'current'
            : 'stale',
      index,
      parentPath,
    });
  }

  visit(params.targetAbsolute, null);

  return candidates;
}

function directChildren(
  candidates: SummarizeCandidate[],
  path: string,
): SummarizeCandidate[] {
  return candidates.filter((candidate) => candidate.parentPath === path);
}

function descendants(
  candidates: SummarizeCandidate[],
  candidate: SummarizeCandidate,
): SummarizeCandidate[] {
  const fromCandidate = (path: string): boolean => {
    const value = relative(candidate.absolutePath, path);

    return value !== '' && value !== '..' && !value.startsWith(`..${sep}`);
  };

  return candidates.filter((value) => fromCandidate(value.absolutePath));
}

function invalidCoverage(candidates: SummarizeCandidate[]) {
  return {
    missing: candidates
      .filter((candidate) => candidate.status === 'missing')
      .map((candidate) => candidate.path),
    stale: candidates
      .filter((candidate) => candidate.status === 'stale')
      .map((candidate) => candidate.path),
  };
}

function candidateCoverage(
  candidates: SummarizeCandidate[],
  candidate: SummarizeCandidate,
): BottomupIndex['coverage'] {
  const invalid = invalidCoverage(descendants(candidates, candidate));

  return {
    complete: invalid.missing.length === 0 && invalid.stale.length === 0,
    ...invalid,
  };
}

function assertCoverage(
  candidates: SummarizeCandidate[],
  noPartial: boolean,
): void {
  if (!noPartial) {
    return;
  }

  const invalid = invalidCoverage(candidates);

  if (invalid.missing.length === 0 && invalid.stale.length === 0) {
    return;
  }

  throw new Error(
    [
      'Summarization requires complete, current generated coverage in --no-partial mode.',
      ...invalid.missing.map((path) => `missing: ${path}`),
      ...invalid.stale.map((path) => `stale: ${path}`),
      'Run bottomup.generate first or omit --no-partial.',
    ].join('\n'),
  );
}

function encodeState(state: SummarizeDraftState): string {
  return Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');
}

function decodeState(value: string): SummarizeDraftState {
  try {
    return SummarizeDraftStateSchema.parse(
      JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown,
    );
  } catch {
    throw new Error('Invalid or expired bottom-up summarize draft state.');
  }
}

async function processSummaries(params: {
  workspaceRoot: string;
  candidates: SummarizeCandidate[];
  options: SummarizeResolvedOptions;
  runPrompt?: GeneratePrompt;
  sessionIds?: Record<string, string>;
}) {
  const proposed = new Map<string, BottomupIndex>();
  const summaries = new Map<string, NonNullable<BottomupIndex['summary']>>();
  const updated: string[] = [];
  const skipped: string[] = [];
  const sessions: Record<string, string> = {};
  let aiCalls = 0;

  for (const candidate of params.candidates) {
    if (candidate.status !== 'current' || candidate.index === null) {
      continue;
    }

    const index = candidate.index;

    const childSummaries = directChildren(params.candidates, candidate.path)
      .map((child) => {
        const summary = summaries.get(child.path);

        return summary === undefined ? null : { path: child.path, summary };
      })
      .filter(
        (
          child,
        ): child is {
          path: string;
          summary: NonNullable<BottomupIndex['summary']>;
        } => child !== null,
      );

    const coverage = candidateCoverage(params.candidates, candidate);

    const inputHash = computeSummaryInputHash({
      index,
      children: childSummaries,
      coverage,
    });

    const suppliedSummary =
      params.options.agentContext?.directories[candidate.path]?.sourceSummary ??
      null;

    const summaryCurrent =
      params.options.prompt === null &&
      suppliedSummary === null &&
      index.summary?.inputHash === inputHash;

    const coverageCurrent =
      JSON.stringify(index.coverage) === JSON.stringify(coverage);

    if (summaryCurrent && coverageCurrent) {
      summaries.set(candidate.path, index.summary!);
      proposed.set(candidate.path, index);
      skipped.push(candidate.path);
      continue;
    }

    let value: string;
    let provenance: NonNullable<BottomupIndex['summary']>['provenance'];

    if (params.options.prompt === null && suppliedSummary !== null) {
      value = suppliedSummary;
      provenance = 'agent';
    } else if (params.options.prompt === null && childSummaries.length === 0) {
      value = index.source.directorySummary;
      provenance = 'derived';
    } else if (summaryCurrent) {
      value = index.summary!.value;
      provenance = index.summary!.provenance;
    } else {
      const invalid = invalidCoverage(
        descendants(params.candidates, candidate),
      );

      const execution = await runSummarizeAgent({
        runPrompt: params.runPrompt,
        cwd: params.workspaceRoot,
        model: params.options.model,
        sessionId: params.sessionIds?.[candidate.path] ?? null,
        directoryPath: candidate.path,
        prompt: params.options.prompt,
        directorySourceSummary: index.source.directorySummary,
        children: childSummaries.map((child) => ({
          path: child.path,
          summary: child.summary.value,
          complete:
            proposed.get(child.path)?.coverage.complete ??
            params.candidates.find((value) => value.path === child.path)!.index!
              .coverage.complete,
        })),
        incompleteCoverage: invalid,
        suppliedSummary,
      });

      aiCalls++;
      sessions[candidate.path] = execution.sessionId;
      value = execution.response.summary;
      provenance = 'ai';
    }

    const summary = {
      version: BOTTOMUP_SUMMARY_VERSION,
      inputHash,
      value,
      provenance,
    } as const;

    const next = { ...index, coverage, summary };

    summaries.set(candidate.path, summary);
    proposed.set(candidate.path, next);
    updated.push(candidate.path);
  }

  return { proposed, updated, skipped, sessions, aiCalls };
}

function buildPlan(params: {
  workspaceRoot: string;
  root: ReturnType<typeof resolveGenerateRoot>;
  candidates: SummarizeCandidate[];
  options: SummarizeResolvedOptions;
}): SummarizePlan {
  const invalid = invalidCoverage(params.candidates);

  const strictBlocked =
    params.options.noPartial &&
    (invalid.missing.length > 0 || invalid.stale.length > 0);

  const warnings: string[] = [];

  if (params.root.source === 'workspace fallback') {
    warnings.push('No marked root was found; using workspace root.');
  }

  if (strictBlocked) {
    warnings.push('Strict summarization is blocked by incomplete coverage.');
  }

  const changed = new Map<string, boolean>();
  let expectedAiCalls = 0;
  const affectedFiles: string[] = [];

  for (const candidate of strictBlocked ? [] : params.candidates) {
    if (candidate.status !== 'current' || candidate.index === null) {
      changed.set(candidate.path, true);
      continue;
    }

    const children = directChildren(params.candidates, candidate.path);

    const availableChildren = children.filter(
      (child) => child.status === 'current' && child.index !== null,
    );

    const childInputs = availableChildren.flatMap((child) =>
      child.index?.summary === null || child.index?.summary === undefined
        ? []
        : [{ path: child.path, summary: child.index.summary }],
    );

    const coverage = candidateCoverage(params.candidates, candidate);

    const inputHash = computeSummaryInputHash({
      index: candidate.index,
      children: childInputs,
      coverage,
    });

    const supplied =
      params.options.agentContext?.directories[candidate.path]?.sourceSummary ??
      null;

    const childChanged = availableChildren.some(
      (child) => changed.get(child.path) ?? true,
    );

    const summaryCurrent =
      params.options.prompt === null &&
      supplied === null &&
      candidate.index.summary?.inputHash === inputHash &&
      !childChanged;

    const coverageCurrent =
      JSON.stringify(candidate.index.coverage) === JSON.stringify(coverage);

    const needsUpdate = !summaryCurrent || !coverageCurrent;

    const needsAi =
      !summaryCurrent &&
      supplied === null &&
      (params.options.prompt !== null || availableChildren.length > 0);

    changed.set(candidate.path, !summaryCurrent);

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
  }

  return {
    path: params.candidates.at(-1)!.path,
    root: params.root.relativePath,
    rootSource: params.root.source,
    complete: invalid.missing.length === 0 && invalid.stale.length === 0,
    currentDirectories: params.candidates.filter(
      (candidate) => candidate.status === 'current',
    ).length,
    ...invalid,
    expectedAiCalls,
    affectedFiles,
    warnings,
  };
}

export async function executeBottomupSummarize(params: {
  workspaceRoot: string;
  call: BottomupSummarizeCall;
  draftAllowed?: boolean;
  runPrompt?: GeneratePrompt;
  sessionIds?: Record<string, string>;
}): Promise<SummarizeResult> {
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

  if (options.plan) {
    return {
      type: 'plan',
      plan: buildPlan({
        workspaceRoot: params.workspaceRoot,
        root,
        candidates,
        options,
      }),
    };
  }

  assertCoverage(candidates, options.noPartial);
  const invalid = invalidCoverage(candidates);

  const processed = await processSummaries({
    workspaceRoot: params.workspaceRoot,
    candidates,
    options,
    runPrompt: params.runPrompt,
    sessionIds: params.sessionIds,
  });

  if (options.draft) {
    const baseHashes: Record<string, string | null> = {};
    const sourceInputHashes: Record<string, string> = {};
    const proposedFiles: Record<string, string> = {};
    const diffs: string[] = [];

    for (const candidate of candidates) {
      if (candidate.status !== 'current' || candidate.index === null) {
        continue;
      }

      const filePath = workspaceRelative(
        params.workspaceRoot,
        join(candidate.absolutePath, BOTTOMUP_INDEX_FILE),
      );

      baseHashes[filePath] = indexFileHash(candidate.absolutePath);
      sourceInputHashes[filePath] = candidate.index.source.inputHash;
    }

    for (const path of processed.updated) {
      const candidate = candidates.find((value) => value.path === path)!;

      const filePath = workspaceRelative(
        params.workspaceRoot,
        join(candidate.absolutePath, BOTTOMUP_INDEX_FILE),
      );

      const existing = readFileSync(
        join(candidate.absolutePath, BOTTOMUP_INDEX_FILE),
        'utf8',
      );

      const proposed = serializeIndex(processed.proposed.get(path)!);

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
        scope: candidates.map(({ path, status }) => ({
          path,
          generated: status !== 'missing',
        })),
        baseHashes,
        sourceInputHashes,
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

export async function reviseBottomupSummarizeDraft(params: {
  workspaceRoot: string;
  state: string;
  prompt: string;
  runPrompt?: GeneratePrompt;
}): Promise<Extract<SummarizeResult, { type: 'draft' }>> {
  const state = decodeState(params.state);
  const call = BottomupSummarizeCallSchema.parse(state.call);
  const directories: Record<string, { source_summary?: string }> = {};

  for (const serialized of Object.values(state.proposedFiles)) {
    const index = JSON.parse(serialized) as BottomupIndex;
    directories[index.path] = { source_summary: index.summary?.value };
  }

  const result = await executeBottomupSummarize({
    workspaceRoot: params.workspaceRoot,
    draftAllowed: true,
    runPrompt: params.runPrompt,
    sessionIds: state.agentSessionIds,
    call: {
      ...call,
      draft: true,
      plan: false,
      prompt: params.prompt,
      agent_context: {
        context: null,
        files: {},
        directories,
      },
    },
  });

  if (result.type !== 'draft') {
    throw new Error('Revision did not produce a summarize draft.');
  }

  return result;
}

export function acceptBottomupSummarizeDraft(params: {
  workspaceRoot: string;
  state: string;
}): { files: string[] } {
  const state = decodeState(params.state);
  const call = BottomupSummarizeCallSchema.parse(state.call);
  const target = resolveDirectory(params.workspaceRoot, call.path);

  const root = resolveGenerateRoot({
    workspaceRoot: params.workspaceRoot,
    targetAbsolute: target.absolutePath,
    explicitRoot: call.root,
  });

  const options = normalizeOptions(call);

  const currentScope = collectCandidates({
    workspaceRoot: params.workspaceRoot,
    rootAbsolute: root.absolutePath,
    targetAbsolute: target.absolutePath,
    options,
  }).map(({ path, status }) => ({
    path,
    generated: status !== 'missing',
  }));

  if (JSON.stringify(currentScope) !== JSON.stringify(state.scope)) {
    throw new Error(
      'Cannot accept summarize draft: directory scope changed during review.',
    );
  }

  const parsed: Array<{
    filePath: string;
    directoryAbsolute: string;
    index: BottomupIndex;
  }> = [];

  for (const [filePath, baseHash] of Object.entries(state.baseHashes)) {
    const directory = resolveDirectory(params.workspaceRoot, dirname(filePath));

    if (indexFileHash(directory.absolutePath) !== baseHash) {
      throw new Error(
        `Cannot accept summarize draft: ${filePath} changed during review.`,
      );
    }

    const actualSourceHash = sourceInputHash(
      directFileHashes(
        listGenerateEntries({
          rootAbsolute: root.absolutePath,
          directoryAbsolute: directory.absolutePath,
          filter: createGenerateFilter({
            rootAbsolute: root.absolutePath,
            respectGitignore: call.respect_gitignore ?? true,
            includeHidden: call.include_hidden ?? false,
            extraIgnore: call.extra_ignore ?? [],
            targetRelativeToRoot:
              toPosix(relative(root.absolutePath, directory.absolutePath)) ||
              '.',
          }),
        }).files,
      ),
    );

    if (actualSourceHash !== state.sourceInputHashes[filePath]) {
      throw new Error(
        `Cannot accept summarize draft: source changed under ${dirname(filePath)}.`,
      );
    }
  }

  for (const [filePath, serialized] of Object.entries(state.proposedFiles)) {
    if (!(filePath in state.baseHashes)) {
      throw new Error(`Draft path is outside the reviewed scope: ${filePath}`);
    }

    const directory = resolveDirectory(params.workspaceRoot, dirname(filePath));

    const expected = workspaceRelative(
      params.workspaceRoot,
      join(directory.absolutePath, BOTTOMUP_INDEX_FILE),
    );

    if (expected !== filePath) {
      throw new Error(`Draft path is invalid: ${filePath}`);
    }

    const index = readIndexFromSerialized(serialized, filePath);

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

function readIndexFromSerialized(serialized: string, filePath: string) {
  const index = readIndexSchema(serialized);
  const expectedPath = dirname(filePath) === '.' ? '.' : dirname(filePath);

  if (index.path !== expectedPath) {
    throw new Error(`Draft metadata does not match ${filePath}.`);
  }

  return index;
}

function readIndexSchema(serialized: string): BottomupIndex {
  return BottomupIndexSchema.parse(JSON.parse(serialized) as unknown);
}

export function formatSummarizeResult(result: SummarizeResult): string {
  if (result.type === 'plan') {
    return [
      'Operation: bottomup.summarize',
      `Path: ${result.plan.path}`,
      `Resolved root: ${result.plan.root}`,
      `Root source: ${result.plan.rootSource}`,
      `Coverage: ${result.plan.complete ? 'complete' : 'incomplete'}`,
      `Current directories: ${result.plan.currentDirectories}`,
      `Missing: ${result.plan.missing.length}`,
      `Stale: ${result.plan.stale.length}`,
      `AI summarization calls: up to ${result.plan.expectedAiCalls}`,
      `Proposed JSON files: ${result.plan.affectedFiles.length}`,
      ...result.plan.affectedFiles.map((path) => `  ${path}`),
      ...result.plan.warnings.map((warning) => `Warning: ${warning}`),
    ].join('\n');
  }

  if (result.type === 'draft') {
    return [
      `Summarize draft: ${result.updated.length} updated, ${result.skipped.length} skipped.`,
      `AI calls: ${result.aiCalls}`,
      '',
      result.diff,
    ].join('\n');
  }

  return [
    `Summarized ${result.updated.length}, skipped ${result.skipped.length}.`,
    `Incomplete coverage: ${result.missing.length} missing, ${result.stale.length} stale.`,
    `AI calls: ${result.aiCalls}`,
  ].join('\n');
}

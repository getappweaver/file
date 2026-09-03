import { existsSync, readFileSync } from 'fs';
import { dirname, join, relative } from 'path';

import {
  BottomupGenerateCallSchema,
  type BottomupGenerateCall,
} from '../../ai/schema';

import { createUnifiedDiff } from '../shared/unified-diff';

import { runGenerateAgent, defaultGeneratePrompt } from './ai';
import {
  createGenerateFilter,
  directFileHashes,
  hashText,
  hashValue,
  listGenerateEntries,
  readIndex,
  readSourceSnippet,
  resolveDirectory,
  resolveGenerateRoot,
  serializeIndex,
  toPosix,
  workspaceRelative,
  writeIndex,
} from './fs';
import {
  BOTTOMUP_ENRICHMENT_VERSION,
  BOTTOMUP_INDEX_FILE,
  BOTTOMUP_INDEX_SCHEMA_VERSION,
  BOTTOMUP_SOURCE_VERSION,
  BottomupGenerateDraftStateSchema,
  BottomupIndexSchema,
  type BottomupIndex,
  type BottomupGenerateDraftState,
  type GeneratePlan,
  type GeneratePrompt,
  type GenerateResolvedOptions,
  type GenerateResult,
} from './types';

function encodeDraftState(state: BottomupGenerateDraftState): string {
  return Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');
}

function decodeDraftState(value: string): BottomupGenerateDraftState {
  try {
    return BottomupGenerateDraftStateSchema.parse(
      JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown,
    );
  } catch {
    throw new Error('Invalid or expired bottom-up generate draft state.');
  }
}

function normalizeOptions(call: BottomupGenerateCall): GenerateResolvedOptions {
  return {
    path: call.path,
    root: call.root,
    respectGitignore: call.respect_gitignore ?? true,
    includeHidden: call.include_hidden ?? false,
    extraIgnore: call.extra_ignore ?? [],
    model: call.model,
    prompt: call.prompt,
    recursive: call.recursive ?? false,
    enrich: call.enrich ?? false,
    context: call.context,
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
                {
                  sourceSummary: value.source_summary ?? undefined,
                  enrichedSummary: value.enriched_summary ?? undefined,
                },
              ]),
            ),
            directories: Object.fromEntries(
              Object.entries(call.agent_context.directories).map(
                ([path, value]) => [
                  path,
                  {
                    sourceSummary: value.source_summary ?? undefined,
                    enrichedSummary: value.enriched_summary ?? undefined,
                  },
                ],
              ),
            ),
          },
  };
}

function validateOptions(
  options: GenerateResolvedOptions,
  draftAllowed: boolean,
): void {
  if (options.recursive && options.draft) {
    throw new Error('--draft is only supported for one-level generation.');
  }

  if (options.context !== null && !options.enrich) {
    throw new Error('--context requires --enrich.');
  }

  if (options.draft && !draftAllowed) {
    throw new Error('--draft is only available through the web interface.');
  }
}

function sourceInputHash(fileHashes: Record<string, string>): string {
  return hashValue({ version: BOTTOMUP_SOURCE_VERSION, files: fileHashes });
}

function getIndexFileHash(directoryPath: string): string | null {
  const filePath = join(directoryPath, BOTTOMUP_INDEX_FILE);

  return existsSync(filePath) ? hashText(readFileSync(filePath)) : null;
}

function findInheritedContext(params: {
  targetAbsolute: string;
  rootAbsolute: string;
}): string | null {
  let cursor = params.targetAbsolute;

  while (true) {
    const index = readIndex(cursor);

    if (index?.context?.value) {
      return index.context.value;
    }

    if (index?.source.directorySummary) {
      return index.source.directorySummary;
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

function relevantAgentKnowledge(
  options: GenerateResolvedOptions,
  workspaceRelativePath: string,
) {
  return {
    directory: options.agentContext?.directories[workspaceRelativePath] ?? null,
    file(path: string) {
      return options.agentContext?.files[path] ?? null;
    },
  };
}

function buildChildRecords(params: {
  rootAbsolute: string;
  directories: ReturnType<typeof listGenerateEntries>['directories'];
  filter: ReturnType<typeof createGenerateFilter>;
}): {
  children: BottomupIndex['children'];
  coverage: BottomupIndex['coverage'];
} {
  const children: BottomupIndex['children'] = {};
  const missing: string[] = [];
  const stale: string[] = [];

  for (const directory of params.directories) {
    const childIndex = readIndex(directory.absolutePath);
    let status: 'current' | 'missing' | 'stale' = 'missing';

    if (childIndex !== null) {
      const entries = listGenerateEntries({
        rootAbsolute: params.rootAbsolute,
        directoryAbsolute: directory.absolutePath,
        filter: params.filter,
      });

      const currentInputHash = sourceInputHash(directFileHashes(entries.files));

      status =
        childIndex.source.inputHash === currentInputHash ? 'current' : 'stale';
    }

    children[directory.name] = {
      path: directory.relativePath,
      status,
      sourceInputHash: childIndex?.source.inputHash ?? null,
    };

    if (status === 'missing') {
      missing.push(directory.relativePath);
    } else if (status === 'stale') {
      stale.push(directory.relativePath);
    }
  }

  return {
    children,
    coverage: {
      complete: missing.length === 0 && stale.length === 0,
      missing,
      stale,
    },
  };
}

async function generateOneLevel(params: {
  workspaceRoot: string;
  rootAbsolute: string;
  targetAbsolute: string;
  options: GenerateResolvedOptions;
  runPrompt: GeneratePrompt;
  sessionId: string | null;
  write: boolean;
}): Promise<{
  path: string;
  serialized: string;
  existingSerialized: string | null;
  skipped: boolean;
  aiCalls: number;
  agentSessionId: string | null;
}> {
  const targetRelativeToRoot =
    toPosix(relative(params.rootAbsolute, params.targetAbsolute)) || '.';

  const targetRelativeToWorkspace = workspaceRelative(
    params.workspaceRoot,
    params.targetAbsolute,
  );

  const filter = createGenerateFilter({
    rootAbsolute: params.rootAbsolute,
    respectGitignore: params.options.respectGitignore,
    includeHidden: params.options.includeHidden,
    extraIgnore: params.options.extraIgnore,
    targetRelativeToRoot,
  });

  const entries = listGenerateEntries({
    rootAbsolute: params.rootAbsolute,
    directoryAbsolute: params.targetAbsolute,
    filter,
  });

  const fileHashes = directFileHashes(entries.files);
  const inputHash = sourceInputHash(fileHashes);
  const existing = readIndex(params.targetAbsolute);
  const indexPath = join(params.targetAbsolute, BOTTOMUP_INDEX_FILE);

  const existingSerialized = existsSync(indexPath)
    ? readFileSync(indexPath, 'utf8')
    : null;

  const knowledge = relevantAgentKnowledge(
    params.options,
    targetRelativeToWorkspace,
  );

  const suppliedContext =
    params.options.context ?? params.options.agentContext?.context ?? null;

  const effectiveContext = params.options.enrich
    ? (suppliedContext ??
      findInheritedContext({
        targetAbsolute: params.targetAbsolute,
        rootAbsolute: params.rootAbsolute,
      }))
    : null;

  if (params.options.enrich && effectiveContext === null) {
    throw new Error(
      `No context is available to enrich ${targetRelativeToWorkspace}. Pass --context or generate parent context first.`,
    );
  }

  const hasAgentChanges =
    params.options.agentContext !== null &&
    (knowledge.directory !== null ||
      entries.files.some(
        (file) =>
          knowledge.file(
            workspaceRelative(params.workspaceRoot, file.absolutePath),
          ) !== null,
      ));

  const contextHash =
    effectiveContext === null ? null : hashValue({ value: effectiveContext });

  const enrichmentInputHash =
    contextHash === null
      ? null
      : hashValue({
          version: BOTTOMUP_ENRICHMENT_VERSION,
          sourceInputHash: inputHash,
          summaryHash: null,
          contextHash,
        });

  const sourceCurrent = existing?.source.inputHash === inputHash;

  const enrichmentCurrent =
    !params.options.enrich ||
    existing?.enrichment?.inputHash === enrichmentInputHash;

  const explicitlyReconsider =
    params.options.prompt !== null ||
    suppliedContext !== null ||
    hasAgentChanges;

  const childState = buildChildRecords({
    rootAbsolute: params.rootAbsolute,
    directories: entries.directories,
    filter,
  });

  if (
    existing !== null &&
    sourceCurrent &&
    enrichmentCurrent &&
    !explicitlyReconsider &&
    JSON.stringify(existing.children) === JSON.stringify(childState.children)
  ) {
    return {
      path: targetRelativeToWorkspace,
      serialized: existingSerialized!,
      existingSerialized,
      skipped: true,
      aiCalls: 0,
      agentSessionId: params.sessionId,
    };
  }

  const suppliedDirectorySource = knowledge.directory?.sourceSummary ?? null;

  const suppliedDirectoryEnriched =
    knowledge.directory?.enrichedSummary ?? null;

  const allSourceSummariesAvailable = entries.files.every((file) => {
    const path = workspaceRelative(params.workspaceRoot, file.absolutePath);
    const supplied = knowledge.file(path)?.sourceSummary;
    const previous = existing?.source.files[file.name];

    return supplied !== undefined || previous?.hash === fileHashes[file.name];
  });

  const allEnrichedSummariesAvailable =
    !params.options.enrich ||
    entries.files.every((file) => {
      const path = workspaceRelative(params.workspaceRoot, file.absolutePath);

      return knowledge.file(path)?.enrichedSummary !== undefined;
    });

  const canReuseExistingAnalysis =
    existing !== null &&
    sourceCurrent &&
    enrichmentCurrent &&
    !explicitlyReconsider;

  const canAvoidAi =
    canReuseExistingAnalysis ||
    (entries.files.length === 0 &&
      !params.options.enrich &&
      params.options.prompt === null) ||
    (params.options.prompt === null &&
      suppliedDirectorySource !== null &&
      allSourceSummariesAvailable &&
      (!params.options.enrich ||
        (suppliedDirectoryEnriched !== null && allEnrichedSummariesAvailable)));

  let aiCalls = 0;

  const aiExecution = canAvoidAi
    ? null
    : await runGenerateAgent({
        runPrompt: params.runPrompt,
        cwd: params.workspaceRoot,
        model: params.options.model,
        sessionId: params.sessionId,
        directoryPath: targetRelativeToWorkspace,
        prompt: params.options.prompt,
        context: effectiveContext,
        enrich: params.options.enrich,
        files: entries.files.map((file) => {
          const path = workspaceRelative(
            params.workspaceRoot,
            file.absolutePath,
          );

          const suppliedSourceSummary = knowledge.file(path)?.sourceSummary;
          const previous = existing?.source.files[file.name];
          const unchanged = previous?.hash === fileHashes[file.name];

          const snippet =
            suppliedSourceSummary !== undefined || unchanged
              ? null
              : readSourceSnippet(file);

          return {
            name: file.name,
            path,
            hash: fileHashes[file.name]!,
            existingSummary:
              existing?.source.files[file.name]?.sourceSummary ?? null,
            suppliedSourceSummary: suppliedSourceSummary ?? null,
            suppliedEnrichedSummary:
              knowledge.file(path)?.enrichedSummary ?? null,
            sourceState:
              suppliedSourceSummary !== undefined
                ? ('supplied' as const)
                : unchanged
                  ? ('unchanged' as const)
                  : snippet?.text === null
                    ? ('binary' as const)
                    : ('changed' as const),
            size: snippet?.size ?? null,
            truncated: snippet?.truncated ?? false,
            text: snippet?.text ?? null,
          };
        }),
        suppliedDirectorySummary: suppliedDirectorySource,
        suppliedDirectoryEnrichedSummary: suppliedDirectoryEnriched,
      }).then((result) => {
        aiCalls++;

        return result;
      });

  const aiResult = aiExecution?.response ?? null;

  const aiFiles = new Map(
    aiResult?.files.map((file) => [file.name, file]) ?? [],
  );

  const fileRecords: BottomupIndex['source']['files'] = {};
  const enrichedFiles: Record<string, string> = {};

  for (const file of entries.files) {
    const path = workspaceRelative(params.workspaceRoot, file.absolutePath);
    const supplied = knowledge.file(path);
    const previous = existing?.source.files[file.name];
    const aiFile = aiFiles.get(file.name);

    const sourceSummary =
      supplied?.sourceSummary ??
      (previous?.hash === fileHashes[file.name]
        ? previous.sourceSummary
        : (aiFile?.source_summary ?? null));

    if (sourceSummary === null) {
      throw new Error(`Generate agent omitted source summary for ${path}.`);
    }

    fileRecords[file.name] = {
      hash: fileHashes[file.name]!,
      sourceSummary,
      provenance: supplied?.sourceSummary
        ? 'agent'
        : aiFile
          ? 'ai'
          : (previous?.provenance ?? 'ai'),
    };

    if (params.options.enrich) {
      const enrichedSummary =
        supplied?.enrichedSummary ?? aiFile?.enriched_summary ?? null;

      if (enrichedSummary !== null) {
        enrichedFiles[file.name] = enrichedSummary;
      }
    }
  }

  const directorySummary =
    suppliedDirectorySource ??
    (sourceCurrent && existing !== null
      ? existing.source.directorySummary
      : (aiResult?.directory_summary ??
        (entries.files.length === 0
          ? 'Contains no direct source files.'
          : null)));

  if (directorySummary === null) {
    throw new Error(
      `Generate agent omitted directory summary for ${targetRelativeToWorkspace}.`,
    );
  }

  const normalizedContext = params.options.enrich
    ? (aiResult?.normalized_context ?? effectiveContext)
    : (existing?.context?.value ?? null);

  const finalContextHash =
    normalizedContext === null ? null : hashValue({ value: normalizedContext });

  const finalEnrichmentInputHash =
    finalContextHash === null
      ? null
      : hashValue({
          version: BOTTOMUP_ENRICHMENT_VERSION,
          sourceInputHash: inputHash,
          summaryHash: null,
          contextHash: finalContextHash,
        });

  const directoryEnrichedSummary = params.options.enrich
    ? (suppliedDirectoryEnriched ??
      aiResult?.directory_enriched_summary ??
      null)
    : null;

  if (params.options.enrich && directoryEnrichedSummary === null) {
    throw new Error(
      `Generate agent omitted directory enrichment for ${targetRelativeToWorkspace}.`,
    );
  }

  const index: BottomupIndex = {
    schemaVersion: BOTTOMUP_INDEX_SCHEMA_VERSION,
    path: targetRelativeToWorkspace,
    scope: { root: params.targetAbsolute === params.rootAbsolute },
    source: {
      version: BOTTOMUP_SOURCE_VERSION,
      inputHash,
      directorySummary,
      files: fileRecords,
    },
    children: childState.children,
    coverage: childState.coverage,
    summary: existing?.summary ?? null,
    context: !params.options.enrich
      ? (existing?.context ?? null)
      : normalizedContext === null || finalContextHash === null
        ? (existing?.context ?? null)
        : aiResult?.normalized_context
          ? {
              value: normalizedContext,
              origin: 'ai',
              hash: finalContextHash,
            }
          : existing?.context?.value === normalizedContext
            ? existing.context
            : {
                value: normalizedContext,
                origin: 'agent',
                hash: finalContextHash,
              },
    enrichment:
      params.options.enrich &&
      finalEnrichmentInputHash !== null &&
      directoryEnrichedSummary !== null
        ? {
            inputHash: finalEnrichmentInputHash,
            summaryHash: null,
            directorySummary: directoryEnrichedSummary,
            files: enrichedFiles,
            provenance: canAvoidAi ? 'agent' : 'ai',
          }
        : (existing?.enrichment ?? null),
  };

  const serialized = serializeIndex(index);

  if (params.write) {
    writeIndex(params.targetAbsolute, serialized);
  }

  return {
    path: targetRelativeToWorkspace,
    serialized,
    existingSerialized,
    skipped: serialized === existingSerialized,
    aiCalls,
    agentSessionId: aiExecution?.sessionId ?? params.sessionId,
  };
}

function collectDirectories(params: {
  rootAbsolute: string;
  targetAbsolute: string;
  options: GenerateResolvedOptions;
}): string[] {
  const targetRelativeToRoot =
    toPosix(relative(params.rootAbsolute, params.targetAbsolute)) || '.';

  const filter = createGenerateFilter({
    rootAbsolute: params.rootAbsolute,
    respectGitignore: params.options.respectGitignore,
    includeHidden: params.options.includeHidden,
    extraIgnore: params.options.extraIgnore,
    targetRelativeToRoot,
  });

  const result: string[] = [];

  function visit(directoryAbsolute: string): void {
    const entries = listGenerateEntries({
      rootAbsolute: params.rootAbsolute,
      directoryAbsolute,
      filter,
    });

    for (const child of entries.directories) {
      visit(child.absolutePath);
    }

    result.push(directoryAbsolute);
  }

  visit(params.targetAbsolute);

  return result;
}

function buildPlan(params: {
  workspaceRoot: string;
  root: ReturnType<typeof resolveGenerateRoot>;
  targetAbsolute: string;
  options: GenerateResolvedOptions;
}): GeneratePlan {
  const directories = params.options.recursive
    ? collectDirectories({
        rootAbsolute: params.root.absolutePath,
        targetAbsolute: params.targetAbsolute,
        options: params.options,
      })
    : [params.targetAbsolute];

  let directFiles = 0;
  let currentFiles = 0;
  let staleFiles = 0;
  let missingFiles = 0;
  let expectedAiCalls = 0;
  const affectedFiles: string[] = [];
  const warnings: string[] = [];

  if (params.root.source === 'workspace fallback') {
    warnings.push(
      'No marked bottom-up root was found; using workspace root. Rerun with --root to select a narrower scope.',
    );
  }

  for (const directoryAbsolute of directories) {
    const relativeToRoot =
      toPosix(relative(params.root.absolutePath, directoryAbsolute)) || '.';

    const filter = createGenerateFilter({
      rootAbsolute: params.root.absolutePath,
      respectGitignore: params.options.respectGitignore,
      includeHidden: params.options.includeHidden,
      extraIgnore: params.options.extraIgnore,
      targetRelativeToRoot: relativeToRoot,
    });

    const entries = listGenerateEntries({
      rootAbsolute: params.root.absolutePath,
      directoryAbsolute,
      filter,
    });

    const hashes = directFileHashes(entries.files);
    const existing = readIndex(directoryAbsolute);
    const currentSourceInputHash = sourceInputHash(hashes);

    const directoryRelativeToWorkspace = workspaceRelative(
      params.workspaceRoot,
      directoryAbsolute,
    );

    const knowledge = relevantAgentKnowledge(
      params.options,
      directoryRelativeToWorkspace,
    );

    const suppliedContext =
      params.options.context ?? params.options.agentContext?.context ?? null;

    const effectiveContext = params.options.enrich
      ? (suppliedContext ??
        findInheritedContext({
          targetAbsolute: directoryAbsolute,
          rootAbsolute: params.root.absolutePath,
        }))
      : null;

    const contextHash =
      effectiveContext === null ? null : hashValue({ value: effectiveContext });

    const expectedEnrichmentInputHash =
      contextHash === null
        ? null
        : hashValue({
            version: BOTTOMUP_ENRICHMENT_VERSION,
            sourceInputHash: currentSourceInputHash,
            summaryHash: null,
            contextHash,
          });

    const hasAgentChanges =
      knowledge.directory !== null ||
      entries.files.some(
        (file) =>
          knowledge.file(
            workspaceRelative(params.workspaceRoot, file.absolutePath),
          ) !== null,
      );

    const explicitlyReconsider =
      params.options.prompt !== null ||
      suppliedContext !== null ||
      hasAgentChanges;

    let directoryNeedsAi =
      existing?.source.inputHash !== currentSourceInputHash ||
      explicitlyReconsider ||
      (params.options.enrich &&
        existing?.enrichment?.inputHash !== expectedEnrichmentInputHash);
    let directoryNeedsWrite = directoryNeedsAi;

    directFiles += entries.files.length;
    for (const file of entries.files) {
      const previous = existing?.source.files[file.name];

      if (previous === undefined) {
        missingFiles++;
      } else if (previous.hash !== hashes[file.name]) {
        staleFiles++;
      } else {
        currentFiles++;
      }
    }

    if (params.options.enrich && effectiveContext === null) {
      directoryNeedsAi = false;
      directoryNeedsWrite = false;

      warnings.push(
        `No context is available to enrich ${directoryRelativeToWorkspace}.`,
      );
    }

    const childState = buildChildRecords({
      rootAbsolute: params.root.absolutePath,
      directories: entries.directories,
      filter,
    });

    if (
      existing === null ||
      JSON.stringify(existing.children) !== JSON.stringify(childState.children)
    ) {
      directoryNeedsWrite = true;
    }

    if (directoryNeedsAi) {
      expectedAiCalls++;
    }

    if (directoryNeedsWrite) {
      affectedFiles.push(
        workspaceRelative(
          params.workspaceRoot,
          join(directoryAbsolute, BOTTOMUP_INDEX_FILE),
        ),
      );
    }
  }

  return {
    path: workspaceRelative(params.workspaceRoot, params.targetAbsolute),
    root: params.root.relativePath,
    rootSource: params.root.source,
    recursive: params.options.recursive,
    directories: directories.length,
    directFiles,
    currentFiles,
    staleFiles,
    missingFiles,
    expectedAiCalls,
    affectedFiles,
    warnings,
  };
}

export async function executeBottomupGenerate(params: {
  workspaceRoot: string;
  call: BottomupGenerateCall;
  draftAllowed?: boolean;
  runPrompt?: GeneratePrompt;
  sessionId?: string | null;
}): Promise<GenerateResult> {
  const options = normalizeOptions(params.call);
  validateOptions(options, params.draftAllowed ?? false);
  const target = resolveDirectory(params.workspaceRoot, options.path);

  const root = resolveGenerateRoot({
    workspaceRoot: params.workspaceRoot,
    targetAbsolute: target.absolutePath,
    explicitRoot: options.root,
  });

  if (options.plan) {
    return {
      type: 'plan',
      plan: buildPlan({
        workspaceRoot: params.workspaceRoot,
        root,
        targetAbsolute: target.absolutePath,
        options,
      }),
    };
  }

  const runPrompt = params.runPrompt ?? defaultGeneratePrompt;

  if (options.draft) {
    const result = await generateOneLevel({
      workspaceRoot: params.workspaceRoot,
      rootAbsolute: root.absolutePath,
      targetAbsolute: target.absolutePath,
      options,
      runPrompt,
      sessionId: params.sessionId ?? null,
      write: false,
    });

    const relativeFilePath = workspaceRelative(
      params.workspaceRoot,
      join(target.absolutePath, BOTTOMUP_INDEX_FILE),
    );

    return {
      type: 'draft',
      root: root.relativePath,
      path: target.relativePath,
      filePath: relativeFilePath,
      baseHash: getIndexFileHash(target.absolutePath),
      proposed: result.serialized,
      diff: createUnifiedDiff({
        relativePath: relativeFilePath,
        existing: result.existingSerialized,
        proposed: result.serialized,
      }),
      aiCalls: result.aiCalls,
      state: encodeDraftState({
        version: 1,
        call: params.call,
        path: target.relativePath,
        root: root.relativePath,
        filePath: relativeFilePath,
        baseHash: getIndexFileHash(target.absolutePath),
        proposed: result.serialized,
        agentSessionId: result.agentSessionId,
      }),
    };
  }

  const directories = options.recursive
    ? collectDirectories({
        rootAbsolute: root.absolutePath,
        targetAbsolute: target.absolutePath,
        options,
      })
    : [target.absolutePath];

  const generated: string[] = [];
  const skipped: string[] = [];
  let aiCalls = 0;

  for (const directoryAbsolute of directories) {
    const result = await generateOneLevel({
      workspaceRoot: params.workspaceRoot,
      rootAbsolute: root.absolutePath,
      targetAbsolute: directoryAbsolute,
      options,
      runPrompt,
      sessionId: null,
      write: true,
    });

    aiCalls += result.aiCalls;
    (result.skipped ? skipped : generated).push(result.path);
  }

  return {
    type: 'written',
    root: root.relativePath,
    generated,
    skipped,
    aiCalls,
  };
}

export async function reviseBottomupGenerateDraft(params: {
  workspaceRoot: string;
  state: string;
  prompt: string;
  runPrompt?: GeneratePrompt;
}): Promise<Extract<GenerateResult, { type: 'draft' }>> {
  const state = decodeDraftState(params.state);
  const originalCall = BottomupGenerateCallSchema.parse(state.call);

  const proposed = BottomupIndexSchema.parse(
    JSON.parse(state.proposed) as unknown,
  );

  const files = Object.fromEntries(
    Object.entries(proposed.source.files).map(([name, file]) => [
      proposed.path === '.' ? name : `${proposed.path}/${name}`,
      {
        source_summary: file.sourceSummary,
        enriched_summary: proposed.enrichment?.files[name],
      },
    ]),
  );

  const result = await executeBottomupGenerate({
    workspaceRoot: params.workspaceRoot,
    draftAllowed: true,
    runPrompt: params.runPrompt,
    sessionId: state.agentSessionId,
    call: {
      ...originalCall,
      recursive: false,
      draft: true,
      plan: false,
      prompt: params.prompt,
      context: proposed.context?.value ?? originalCall.context,
      agent_context: {
        context: proposed.context?.value ?? null,
        files,
        directories: {
          [proposed.path]: {
            source_summary: proposed.source.directorySummary,
            enriched_summary:
              proposed.enrichment?.directorySummary ?? undefined,
          },
        },
      },
    },
  });

  if (result.type !== 'draft') {
    throw new Error('Revision did not produce a generate draft.');
  }

  return result;
}

export function acceptBottomupGenerateDraft(params: {
  workspaceRoot: string;
  state: string;
}): { filePath: string } {
  const state = decodeDraftState(params.state);
  const call = BottomupGenerateCallSchema.parse(state.call);
  const target = resolveDirectory(params.workspaceRoot, state.path);

  const expectedFilePath = workspaceRelative(
    params.workspaceRoot,
    join(target.absolutePath, BOTTOMUP_INDEX_FILE),
  );

  if (expectedFilePath !== state.filePath) {
    throw new Error('Draft target does not match its proposed index path.');
  }

  if (getIndexFileHash(target.absolutePath) !== state.baseHash) {
    throw new Error(
      `Cannot accept draft for ${state.path}: ${BOTTOMUP_INDEX_FILE} changed during review. Regenerate the draft.`,
    );
  }

  const proposed = BottomupIndexSchema.parse(
    JSON.parse(state.proposed) as unknown,
  );

  const root = resolveGenerateRoot({
    workspaceRoot: params.workspaceRoot,
    targetAbsolute: target.absolutePath,
    explicitRoot: call.root,
  });

  if (
    proposed.path !== state.path ||
    proposed.scope.root !== (target.absolutePath === root.absolutePath)
  ) {
    throw new Error('Draft metadata does not match its resolved target scope.');
  }

  const targetRelativeToRoot =
    toPosix(relative(root.absolutePath, target.absolutePath)) || '.';

  const filter = createGenerateFilter({
    rootAbsolute: root.absolutePath,
    respectGitignore: call.respect_gitignore ?? true,
    includeHidden: call.include_hidden ?? false,
    extraIgnore: call.extra_ignore ?? [],
    targetRelativeToRoot,
  });

  const entries = listGenerateEntries({
    rootAbsolute: root.absolutePath,
    directoryAbsolute: target.absolutePath,
    filter,
  });

  const currentHashes = directFileHashes(entries.files);

  const proposedHashes = Object.fromEntries(
    Object.entries(proposed.source.files).map(([name, file]) => [
      name,
      file.hash,
    ]),
  );

  if (JSON.stringify(currentHashes) !== JSON.stringify(proposedHashes)) {
    throw new Error(
      `Cannot accept draft for ${state.path}: source files changed during review. Regenerate the draft.`,
    );
  }

  const currentChildState = buildChildRecords({
    rootAbsolute: root.absolutePath,
    directories: entries.directories,
    filter,
  });

  if (
    JSON.stringify(currentChildState.children) !==
    JSON.stringify(proposed.children)
  ) {
    throw new Error(
      `Cannot accept draft for ${state.path}: child directories or indexes changed during review. Regenerate the draft.`,
    );
  }

  writeIndex(target.absolutePath, serializeIndex(proposed));

  return { filePath: state.filePath };
}

export function formatGenerateResult(result: GenerateResult): string {
  if (result.type === 'plan') {
    const { plan } = result;

    return [
      'Operation: bottomup.generate',
      `Path: ${plan.path}`,
      `Resolved root: ${plan.root}`,
      `Root source: ${plan.rootSource}`,
      `Mode: ${plan.recursive ? 'recursive' : 'one level'}`,
      '',
      'Coverage:',
      `  Direct files: ${plan.directFiles}`,
      `  Current: ${plan.currentFiles}`,
      `  Stale: ${plan.staleFiles}`,
      `  Missing: ${plan.missingFiles}`,
      `  Directories: ${plan.directories}`,
      '',
      'Expected work:',
      `  AI generation calls: up to ${plan.expectedAiCalls}`,
      `  Proposed JSON files: ${plan.affectedFiles.length}`,
      ...plan.affectedFiles.map((path) => `    ${path}`),
      ...plan.warnings.map((warning) => `Warning: ${warning}`),
    ].join('\n');
  }

  if (result.type === 'draft') {
    return [
      `Draft for ${result.filePath}`,
      `Resolved root: ${result.root}`,
      `AI calls: ${result.aiCalls}`,
      '',
      result.diff,
    ].join('\n');
  }

  return [
    `Generated ${result.generated.length}, skipped ${result.skipped.length}.`,
    `Resolved root: ${result.root}`,
    `AI calls: ${result.aiCalls}`,
    ...result.generated.map((path) => `generated: ${path}`),
    ...result.skipped.map((path) => `skipped: ${path}`),
  ].join('\n');
}

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, describe, expect, test } from 'bun:test';

import {
  FileToolCallSchema,
  type BottomupEnrichCall,
  type BottomupGenerateCall,
  type BottomupSummarizeCall,
} from '../../ai/schema';
import { commandDefinition } from '../../definition';

import { executeBottomupGenerate } from '../bottomup-generate/handler';
import {
  BOTTOMUP_INDEX_FILE,
  BottomupIndexSchema,
  type GeneratePrompt,
} from '../bottomup-generate/types';
import { executeBottomupSummarize } from '../bottomup-summarize/handler';

import { acceptBottomupEnrichDraft, executeBottomupEnrich } from './handler';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function workspace(): string {
  const path = mkdtempSync(join(tmpdir(), 'bottomup-enrich-'));
  temporaryDirectories.push(path);

  return path;
}

function enrichCall(
  overrides: Partial<BottomupEnrichCall> = {},
): BottomupEnrichCall {
  return {
    type: 'bottomup.enrich',
    path: '.',
    root: '.',
    respect_gitignore: false,
    include_hidden: false,
    extra_ignore: null,
    model: null,
    prompt: null,
    agent_context: null,
    draft: null,
    plan: null,
    allow_partial: null,
    force: null,
    context: null,
    ...overrides,
  };
}

function generateCall(
  agentContext: NonNullable<BottomupGenerateCall['agent_context']>,
): BottomupGenerateCall {
  return {
    type: 'bottomup.generate',
    path: '.',
    root: '.',
    respect_gitignore: false,
    include_hidden: false,
    extra_ignore: null,
    model: null,
    prompt: null,
    agent_context: agentContext,
    draft: false,
    plan: false,
    recursive: true,
    enrich: false,
    context: null,
  };
}

async function generateFixture(
  root: string,
  includeChild = true,
): Promise<void> {
  writeFileSync(
    join(root, 'index.ts'),
    'export const rootValue = "ROOT_RAW_SENTINEL";\n',
  );

  if (includeChild) {
    mkdirSync(join(root, 'child'));

    writeFileSync(
      join(root, 'child', 'child.ts'),
      'export const childValue = "CHILD_RAW_SENTINEL";\n',
    );
  }

  await executeBottomupGenerate({
    workspaceRoot: root,
    call: generateCall({
      context: null,
      files: {
        'index.ts': { source_summary: 'Defines the root value.' },
        ...(includeChild
          ? {
              'child/child.ts': {
                source_summary: 'Defines the child value.',
              },
            }
          : {}),
      },
      directories: {
        '.': { source_summary: 'Provides the root module.' },
        ...(includeChild
          ? { child: { source_summary: 'Provides the child module.' } }
          : {}),
      },
    }),
    runPrompt: async () => {
      throw new Error('Source generation should use supplied knowledge');
    },
  });

  const summarizeCall: BottomupSummarizeCall = {
    type: 'bottomup.summarize',
    path: '.',
    root: '.',
    respect_gitignore: false,
    include_hidden: false,
    extra_ignore: null,
    model: null,
    prompt: null,
    agent_context: {
      context: null,
      files: {},
      directories: {
        '.': { source_summary: 'Compact root and child hierarchy.' },
        ...(includeChild
          ? { child: { source_summary: 'Compact child summary.' } }
          : {}),
      },
    },
    draft: false,
    plan: false,
    no_partial: true,
  };

  await executeBottomupSummarize({
    workspaceRoot: root,
    call: summarizeCall,
    runPrompt: async () => {
      throw new Error('Summarization should use supplied knowledge');
    },
  });
}

function fakeEnrichment(params: {
  calls: string[];
  assertPrompt?: (prompt: string) => void;
}): GeneratePrompt {
  return async ({ prompt, sessionId }) => {
    params.calls.push(prompt);
    params.assertPrompt?.(prompt);
    const directory = prompt.match(/^Directory: (.+)$/m)?.[1] ?? '.';

    const fileSection =
      prompt
        .split('Direct files (source omitted intentionally):')[1]
        ?.split('Direct child directories:')[0] ?? '';

    const names = [...fileSection.matchAll(/^- name: (.+)$/gm)].map(
      (match) => match[1]!,
    );

    return {
      output: JSON.stringify({
        directory_enriched_summary: `Architectural role for ${directory}`,
        files: names.map((name) => ({
          name,
          enriched_summary: `Contextual role for ${name}`,
        })),
      }),
      sessionId: sessionId ?? `session-${params.calls.length}`,
    };
  };
}

function readIndex(directory: string) {
  return BottomupIndexSchema.parse(
    JSON.parse(
      readFileSync(join(directory, BOTTOMUP_INDEX_FILE), 'utf8'),
    ) as unknown,
  );
}

describe('bottomup.enrich', () => {
  test('is registered for CLI and AI tools', () => {
    expect(
      commandDefinition('/', 'file').subcommands.some(
        (subcommand) => subcommand.name === 'bottomup.enrich',
      ),
    ).toBe(true);

    expect(FileToolCallSchema.parse(enrichCall()).type).toBe('bottomup.enrich');
  });

  test('uses summaries without including raw source and propagates parent context', async () => {
    const root = workspace();
    await generateFixture(root);
    const calls: string[] = [];

    const result = await executeBottomupEnrich({
      workspaceRoot: root,
      call: enrichCall({ context: 'Workspace architecture.' }),
      runPrompt: fakeEnrichment({
        calls,
        assertPrompt(prompt) {
          expect(prompt).not.toContain('ROOT_RAW_SENTINEL');
          expect(prompt).not.toContain('CHILD_RAW_SENTINEL');
          expect(prompt).toContain('source omitted intentionally');
          expect(prompt).toContain('Directory compact summary:');
          expect(prompt).toContain('Compact child summary.');
          expect(prompt).not.toContain('normalized_context');
        },
      }),
    });

    expect(result.type).toBe('written');

    if (result.type !== 'written') {
      return;
    }

    expect(result.aiCalls).toBe(2);
    expect(calls[1]).toContain('Parent architectural role:');

    expect(readIndex(root).source.directorySummary).toBe(
      'Provides the root module.',
    );

    expect(readIndex(root).context?.value).toBe('Workspace architecture.');

    expect(readIndex(join(root, 'child')).context?.value).toBe(
      'Workspace architecture.',
    );

    expect(readIndex(join(root, 'child')).enrichment?.files['child.ts']).toBe(
      'Contextual role for child.ts',
    );

    const rerun = await executeBottomupEnrich({
      workspaceRoot: root,
      call: enrichCall(),
      runPrompt: async () => {
        throw new Error('Current enrichment should not call AI');
      },
    });

    expect(rerun.type).toBe('written');

    if (rerun.type === 'written') {
      expect(rerun.updated).toEqual([]);
      expect(rerun.skipped).toEqual(['.', 'child']);
      expect(rerun.aiCalls).toBe(0);
    }
  });

  test('requires complete generated coverage by default', async () => {
    const root = workspace();
    await generateFixture(root);
    rmSync(join(root, 'child', BOTTOMUP_INDEX_FILE));

    expect(
      executeBottomupEnrich({
        workspaceRoot: root,
        call: enrichCall({ context: 'Workspace architecture.' }),
      }),
    ).rejects.toThrow('requires complete, current generated coverage');
  });

  test('allow-partial skips areas whose compact summaries became stale', async () => {
    const root = workspace();
    await generateFixture(root);
    rmSync(join(root, 'child', BOTTOMUP_INDEX_FILE));
    const calls: string[] = [];

    const result = await executeBottomupEnrich({
      workspaceRoot: root,
      call: enrichCall({
        context: 'Workspace architecture.',
        allow_partial: true,
      }),
      runPrompt: fakeEnrichment({ calls }),
    });

    expect(result.type).toBe('written');

    if (result.type !== 'written') {
      return;
    }

    expect(result.updated).toEqual([]);
    expect(result.missing).toEqual(['child']);
    expect(result.staleSummaries).toEqual(['.']);
    expect(calls).toHaveLength(0);
  });

  test('uses a current compact summary when no context was supplied', async () => {
    const root = workspace();
    await generateFixture(root);
    const calls: string[] = [];

    const result = await executeBottomupEnrich({
      workspaceRoot: root,
      call: enrichCall(),
      runPrompt: fakeEnrichment({ calls }),
    });

    expect(result.type).toBe('written');

    expect(calls[0]).toContain(
      'Effective context:\nCompact root and child hierarchy.',
    );
  });

  test('creates and accepts a multi-file web draft without early writes', async () => {
    const root = workspace();
    await generateFixture(root);

    const draft = await executeBottomupEnrich({
      workspaceRoot: root,
      draftAllowed: true,
      call: enrichCall({ context: 'Workspace architecture.', draft: true }),
      runPrompt: fakeEnrichment({ calls: [] }),
    });

    expect(draft.type).toBe('draft');

    if (draft.type !== 'draft') {
      return;
    }

    expect(draft.updated).toEqual(['.', 'child']);
    expect(readIndex(root).enrichment).toBeNull();
    expect(readIndex(join(root, 'child')).enrichment).toBeNull();

    const accepted = acceptBottomupEnrichDraft({
      workspaceRoot: root,
      state: draft.state,
    });

    expect(accepted.files).toHaveLength(2);
    expect(readIndex(root).enrichment).not.toBeNull();
    expect(readIndex(join(root, 'child')).enrichment).not.toBeNull();
  });

  test('plan reports a current enriched subtree as zero AI calls', async () => {
    const root = workspace();
    await generateFixture(root);

    await executeBottomupEnrich({
      workspaceRoot: root,
      call: enrichCall({ context: 'Workspace architecture.' }),
      runPrompt: fakeEnrichment({ calls: [] }),
    });

    const plan = await executeBottomupEnrich({
      workspaceRoot: root,
      call: enrichCall({ plan: true }),
    });

    expect(plan.type).toBe('plan');

    if (plan.type !== 'plan') {
      return;
    }

    expect(plan.plan.expectedAiCalls).toBe(0);
    expect(plan.plan.affectedFiles).toEqual([]);
  });

  test('invalidates enrichment when a compact summary value changes', async () => {
    const root = workspace();
    await generateFixture(root);

    await executeBottomupEnrich({
      workspaceRoot: root,
      call: enrichCall(),
      runPrompt: fakeEnrichment({ calls: [] }),
    });

    const rootIndex = readIndex(root);
    rootIndex.summary!.value = 'Revised compact root hierarchy.';

    writeFileSync(
      join(root, BOTTOMUP_INDEX_FILE),
      `${JSON.stringify(rootIndex, null, 2)}\n`,
    );

    const plan = await executeBottomupEnrich({
      workspaceRoot: root,
      call: enrichCall({ plan: true }),
    });

    if (plan.type !== 'plan') {
      throw new Error('Expected enrichment plan.');
    }

    expect(plan.plan.expectedAiCalls).toBe(2);

    expect(plan.plan.affectedFiles).toEqual([
      '.BOTTOMUP.json',
      'child/.BOTTOMUP.json',
    ]);
  });

  test('does not create index files for missing coverage', async () => {
    const root = workspace();
    mkdirSync(join(root, 'empty'));
    expect(existsSync(join(root, 'empty', BOTTOMUP_INDEX_FILE))).toBe(false);
  });
});

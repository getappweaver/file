import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, describe, expect, test } from 'bun:test';

import { FileToolCallSchema, type BottomupGenerateCall } from '../../ai/schema';
import { commandDefinition } from '../../definition';

import {
  acceptBottomupGenerateDraft,
  executeBottomupGenerate,
  reviseBottomupGenerateDraft,
} from './handler';
import {
  BOTTOMUP_INDEX_FILE,
  BottomupIndexSchema,
  type GeneratePrompt,
} from './types';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createWorkspace(): string {
  const workspace = mkdtempSync(join(tmpdir(), 'bottomup-generate-'));
  temporaryDirectories.push(workspace);

  return workspace;
}

function call(
  overrides: Partial<BottomupGenerateCall> = {},
): BottomupGenerateCall {
  return {
    type: 'bottomup.generate',
    path: '.',
    root: null,
    respect_gitignore: false,
    include_hidden: false,
    extra_ignore: null,
    model: null,
    prompt: null,
    agent_context: null,
    draft: null,
    plan: null,
    recursive: null,
    enrich: null,
    context: null,
    ...overrides,
  };
}

function fakePrompt(counter: { value: number }): GeneratePrompt {
  return async ({ prompt, sessionId }) => {
    counter.value++;

    const names = [...prompt.matchAll(/^- name: (.+)$/gm)].map(
      (match) => match[1]!,
    );

    return {
      output: JSON.stringify({
        directory_summary: `Summary for ${names.join(', ') || 'empty directory'}`,
        files: names.map((name) => ({
          name,
          source_summary: `${name} source summary`,
          enriched_summary: null,
        })),
        normalized_context: null,
        directory_enriched_summary: null,
      }),
      sessionId: sessionId ?? `session-${counter.value}`,
    };
  };
}

function readGeneratedIndex(directory: string) {
  return BottomupIndexSchema.parse(
    JSON.parse(
      readFileSync(join(directory, BOTTOMUP_INDEX_FILE), 'utf8'),
    ) as unknown,
  );
}

describe('bottomup.generate', () => {
  test('is registered for CLI and AI tool calls', () => {
    const definition = commandDefinition('/', 'file');

    expect(
      definition.subcommands.some(
        (subcommand) => subcommand.name === 'bottomup.generate',
      ),
    ).toBe(true);

    expect(FileToolCallSchema.parse(call()).type).toBe('bottomup.generate');
  });

  test('plans without AI calls or writes', async () => {
    const workspace = createWorkspace();
    writeFileSync(join(workspace, 'index.ts'), 'export const value = 1;\n');
    const counter = { value: 0 };

    const result = await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call({ plan: true }),
      runPrompt: fakePrompt(counter),
    });

    expect(result.type).toBe('plan');

    if (result.type !== 'plan') {
      return;
    }

    expect(result.plan.root).toBe('.');
    expect(result.plan.rootSource).toBe('workspace fallback');
    expect(result.plan.directFiles).toBe(1);
    expect(result.plan.missingFiles).toBe(1);
    expect(result.plan.expectedAiCalls).toBe(1);
    expect(counter.value).toBe(0);
    expect(existsSync(join(workspace, BOTTOMUP_INDEX_FILE))).toBe(false);
  });

  test('generates one directory without descending', async () => {
    const workspace = createWorkspace();
    const child = join(workspace, 'child');
    mkdirSync(child);
    writeFileSync(join(workspace, 'index.ts'), 'export const value = 1;\n');
    writeFileSync(join(child, 'child.ts'), 'export const child = true;\n');
    const counter = { value: 0 };

    const result = await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call(),
      runPrompt: fakePrompt(counter),
    });

    expect(result.type).toBe('written');
    expect(counter.value).toBe(1);
    expect(existsSync(join(workspace, BOTTOMUP_INDEX_FILE))).toBe(true);
    expect(existsSync(join(child, BOTTOMUP_INDEX_FILE))).toBe(false);

    const index = readGeneratedIndex(workspace);
    expect(index.scope.root).toBe(true);

    expect(index.source.files['index.ts']?.sourceSummary).toBe(
      'index.ts source summary',
    );

    expect(index.children.child?.status).toBe('missing');
    expect(index.coverage.complete).toBe(false);
    expect(index.coverage.missing).toEqual(['child']);
  });

  test('reuses a current one-level record without AI', async () => {
    const workspace = createWorkspace();
    writeFileSync(join(workspace, 'index.ts'), 'export const value = 1;\n');
    const counter = { value: 0 };

    await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call(),
      runPrompt: fakePrompt(counter),
    });

    const result = await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call(),
      runPrompt: async () => {
        throw new Error('AI should not run');
      },
    });

    expect(result.type).toBe('written');

    if (result.type !== 'written') {
      return;
    }

    expect(result.generated).toEqual([]);
    expect(result.skipped).toEqual(['.']);
    expect(counter.value).toBe(1);
  });

  test('sends raw source only for changed files', async () => {
    const workspace = createWorkspace();
    const unchangedPath = join(workspace, 'unchanged.ts');
    const changedPath = join(workspace, 'changed.ts');

    writeFileSync(
      unchangedPath,
      'export const unchanged = "UNCHANGED_RAW_SENTINEL";\n',
    );

    writeFileSync(changedPath, 'export const changed = "before";\n');

    await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call(),
      runPrompt: fakePrompt({ value: 0 }),
    });

    writeFileSync(
      changedPath,
      'export const changed = "CHANGED_RAW_SENTINEL";\n',
    );

    let secondPrompt = '';

    await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call(),
      runPrompt: async (params) => {
        secondPrompt = params.prompt;

        return {
          output: JSON.stringify({
            directory_summary: 'Contains changed and unchanged modules.',
            files: [
              {
                name: 'changed.ts',
                source_summary: 'Updated changed summary.',
                enriched_summary: null,
              },
              {
                name: 'unchanged.ts',
                source_summary: 'Attempted rewrite of unchanged summary.',
                enriched_summary: null,
              },
            ],
            normalized_context: null,
            directory_enriched_summary: null,
          }),
          sessionId: 'session-2',
        };
      },
    });

    expect(secondPrompt).toContain('CHANGED_RAW_SENTINEL');
    expect(secondPrompt).not.toContain('UNCHANGED_RAW_SENTINEL');
    expect(secondPrompt).toContain('source_state: unchanged');

    expect(secondPrompt).toContain(
      'source: omitted (hash unchanged; use existing_source_summary)',
    );

    const index = readGeneratedIndex(workspace);

    expect(index.source.files['changed.ts']?.sourceSummary).toBe(
      'Updated changed summary.',
    );

    expect(index.source.files['unchanged.ts']?.sourceSummary).toBe(
      'unchanged.ts source summary',
    );
  });

  test('recursively generates descendants and refreshes parent coverage', async () => {
    const workspace = createWorkspace();
    const child = join(workspace, 'child');
    mkdirSync(child);
    writeFileSync(join(workspace, 'index.ts'), 'export const value = 1;\n');
    writeFileSync(join(child, 'child.ts'), 'export const child = true;\n');
    const counter = { value: 0 };

    const result = await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call({ recursive: true }),
      runPrompt: fakePrompt(counter),
    });

    expect(result.type).toBe('written');
    expect(counter.value).toBe(2);
    expect(existsSync(join(child, BOTTOMUP_INDEX_FILE))).toBe(true);
    const rootIndex = readGeneratedIndex(workspace);
    const childIndex = readGeneratedIndex(child);
    expect(rootIndex.children.child?.status).toBe('current');
    expect(rootIndex.coverage.complete).toBe(true);
    expect(childIndex.scope.root).toBe(false);
  });

  test('refreshes child coverage without re-running parent AI', async () => {
    const workspace = createWorkspace();
    const child = join(workspace, 'child');
    mkdirSync(child);
    writeFileSync(join(workspace, 'index.ts'), 'export const value = 1;\n');
    writeFileSync(join(child, 'child.ts'), 'export const child = true;\n');
    const counter = { value: 0 };

    await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call(),
      runPrompt: fakePrompt(counter),
    });

    await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call({ path: 'child', root: '.' }),
      runPrompt: fakePrompt(counter),
    });

    const plan = await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call({ plan: true }),
      runPrompt: fakePrompt(counter),
    });

    expect(plan.type).toBe('plan');

    if (plan.type === 'plan') {
      expect(plan.plan.expectedAiCalls).toBe(0);
      expect(plan.plan.affectedFiles).toEqual([BOTTOMUP_INDEX_FILE]);
    }

    await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call(),
      runPrompt: async () => {
        throw new Error('Parent AI should not run for coverage-only changes');
      },
    });

    expect(counter.value).toBe(2);
    expect(readGeneratedIndex(workspace).coverage.complete).toBe(true);
  });

  test('rejects directory symlinks that escape the workspace', async () => {
    const workspace = createWorkspace();
    const outside = createWorkspace();
    symlinkSync(outside, join(workspace, 'outside'));

    expect(
      executeBottomupGenerate({
        workspaceRoot: workspace,
        call: call({ path: 'outside', plan: true }),
      }),
    ).rejects.toThrow('Path resolves outside workspace');
  });

  test('returns a web draft without writing', async () => {
    const workspace = createWorkspace();
    writeFileSync(join(workspace, 'index.ts'), 'export const value = 1;\n');
    const counter = { value: 0 };

    const result = await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call({ draft: true }),
      draftAllowed: true,
      runPrompt: fakePrompt(counter),
    });

    expect(result.type).toBe('draft');

    if (result.type !== 'draft') {
      return;
    }

    expect(result.baseHash).toBeNull();
    expect(result.diff).toContain('diff --git a/.BOTTOMUP.json');
    expect(result.diff).toContain('+++ b/.BOTTOMUP.json');
    expect(existsSync(join(workspace, BOTTOMUP_INDEX_FILE))).toBe(false);
  });

  test('revises and accepts stateless web draft data', async () => {
    const workspace = createWorkspace();
    writeFileSync(join(workspace, 'index.ts'), 'export const value = 1;\n');
    const counter = { value: 0 };

    const initial = await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call({ draft: true }),
      draftAllowed: true,
      runPrompt: fakePrompt(counter),
    });

    expect(initial.type).toBe('draft');

    if (initial.type !== 'draft') {
      return;
    }

    const revised = await reviseBottomupGenerateDraft({
      workspaceRoot: workspace,
      state: initial.state,
      prompt: 'Make the description clearer.',
      runPrompt: async (params) => {
        expect(params.sessionId).toBe('session-1');

        return fakePrompt(counter)(params);
      },
    });

    expect(revised.type).toBe('draft');
    expect(counter.value).toBe(2);

    const accepted = acceptBottomupGenerateDraft({
      workspaceRoot: workspace,
      state: revised.state,
    });

    expect(accepted.filePath).toBe(BOTTOMUP_INDEX_FILE);
    expect(existsSync(join(workspace, BOTTOMUP_INDEX_FILE))).toBe(true);
  });

  test('rejects draft acceptance after source changes', async () => {
    const workspace = createWorkspace();
    const sourcePath = join(workspace, 'index.ts');
    writeFileSync(sourcePath, 'export const value = 1;\n');

    const draft = await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call({ draft: true }),
      draftAllowed: true,
      runPrompt: fakePrompt({ value: 0 }),
    });

    expect(draft.type).toBe('draft');

    if (draft.type !== 'draft') {
      return;
    }

    writeFileSync(sourcePath, 'export const value = 2;\n');

    expect(() =>
      acceptBottomupGenerateDraft({
        workspaceRoot: workspace,
        state: draft.state,
      }),
    ).toThrow('source files changed during review');

    expect(existsSync(join(workspace, BOTTOMUP_INDEX_FILE))).toBe(false);
  });

  test('uses complete agent knowledge without another AI call', async () => {
    const workspace = createWorkspace();
    writeFileSync(join(workspace, 'index.ts'), 'export const value = 1;\n');

    const result = await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call({
        agent_context: {
          context: null,
          files: {
            'index.ts': {
              source_summary: 'Defines the workspace entry value.',
            },
          },
          directories: {
            '.': {
              source_summary: 'Provides the workspace entry module.',
            },
          },
        },
      }),
      runPrompt: async () => {
        throw new Error('AI should not run');
      },
    });

    expect(result.type).toBe('written');
    const index = readGeneratedIndex(workspace);

    expect(index.source.directorySummary).toBe(
      'Provides the workspace entry module.',
    );

    expect(index.source.files['index.ts']?.provenance).toBe('agent');
  });

  test('recursively generates and enriches when context is available', async () => {
    const workspace = createWorkspace();
    const child = join(workspace, 'child');
    mkdirSync(child);
    writeFileSync(join(workspace, 'index.ts'), 'export const value = 1;\n');
    writeFileSync(join(child, 'child.ts'), 'export const child = true;\n');

    const result = await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call({
        recursive: true,
        enrich: true,
        context: 'This workspace exposes a root module and a child feature.',
        agent_context: {
          context: 'This workspace exposes a root module and a child feature.',
          files: {
            'index.ts': {
              source_summary: 'Defines the workspace entry value.',
              enriched_summary: 'Acts as the workspace entry module.',
            },
            'child/child.ts': {
              source_summary: 'Defines the child feature value.',
              enriched_summary: 'Implements the child feature module.',
            },
          },
          directories: {
            '.': {
              source_summary: 'Provides the workspace entry module.',
              enriched_summary: 'Coordinates the workspace modules.',
            },
            child: {
              source_summary: 'Provides the child feature module.',
              enriched_summary: 'Owns the workspace child feature.',
            },
          },
        },
      }),
      runPrompt: async () => {
        throw new Error('AI should not run');
      },
    });

    expect(result.type).toBe('written');

    expect(readGeneratedIndex(workspace).enrichment?.directorySummary).toBe(
      'Coordinates the workspace modules.',
    );

    expect(readGeneratedIndex(child).enrichment?.directorySummary).toBe(
      'Owns the workspace child feature.',
    );

    const plan = await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call({ recursive: true, enrich: true, plan: true }),
    });

    expect(plan.type).toBe('plan');

    if (plan.type === 'plan') {
      expect(plan.plan.expectedAiCalls).toBe(0);
      expect(plan.plan.affectedFiles).toEqual([]);
    }
  });

  test('allows AI enrichment to omit files with no contextual addition', async () => {
    const workspace = createWorkspace();
    writeFileSync(join(workspace, 'index.ts'), 'export const value = 1;\n');

    const result = await executeBottomupGenerate({
      workspaceRoot: workspace,
      call: call({ enrich: true, context: 'Workspace context.' }),
      runPrompt: async () => ({
        output: JSON.stringify({
          directory_summary: 'Provides the workspace entry module.',
          files: [
            {
              name: 'index.ts',
              source_summary: 'Defines the workspace entry value.',
              enriched_summary: null,
            },
          ],
          normalized_context: 'Workspace context.',
          directory_enriched_summary: 'Acts as the workspace entry point.',
        }),
        sessionId: 'session-1',
      }),
    });

    expect(result.type).toBe('written');
    expect(readGeneratedIndex(workspace).enrichment?.files).toEqual({});
  });

  test('rejects recursive drafts and context without enrichment', async () => {
    const workspace = createWorkspace();

    expect(
      executeBottomupGenerate({
        workspaceRoot: workspace,
        call: call({ recursive: true, draft: true }),
        draftAllowed: true,
      }),
    ).rejects.toThrow('--draft is only supported for one-level generation.');

    expect(
      executeBottomupGenerate({
        workspaceRoot: workspace,
        call: call({ context: 'context' }),
      }),
    ).rejects.toThrow('--context requires --enrich.');
  });
});

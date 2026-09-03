import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { describe, expect, test } from 'bun:test';

import type {
  BottomupGenerateCall,
  BottomupSummarizeCall,
} from '../../ai/schema';
import { FileToolCallSchema } from '../../ai/schema';
import { commandDefinition } from '../../definition';

import { executeBottomupGenerate } from '../bottomup-generate/handler';
import {
  BOTTOMUP_INDEX_FILE,
  BottomupIndexSchema,
} from '../bottomup-generate/types';

import {
  acceptBottomupSummarizeDraft,
  executeBottomupSummarize,
  reviseBottomupSummarizeDraft,
} from './handler';

function workspace(): string {
  const root = mkdtempSync(join(tmpdir(), 'bottomup-summarize-'));
  mkdirSync(join(root, 'child'));
  writeFileSync(join(root, 'index.ts'), 'export const root = true;\n');

  writeFileSync(
    join(root, 'child', 'feature.ts'),
    'export const child = true;\n',
  );

  return root;
}

function generateCall(): BottomupGenerateCall {
  return {
    type: 'bottomup.generate',
    path: '.',
    root: '.',
    respect_gitignore: true,
    include_hidden: false,
    extra_ignore: [],
    model: null,
    prompt: null,
    agent_context: null,
    draft: false,
    plan: false,
    recursive: true,
    enrich: false,
    context: null,
  };
}

function summarizeCall(
  overrides: Partial<BottomupSummarizeCall> = {},
): BottomupSummarizeCall {
  return {
    type: 'bottomup.summarize',
    path: '.',
    root: '.',
    respect_gitignore: true,
    include_hidden: false,
    extra_ignore: [],
    model: null,
    prompt: null,
    agent_context: null,
    draft: false,
    plan: false,
    no_partial: false,
    ...overrides,
  };
}

async function generate(root: string): Promise<void> {
  await executeBottomupGenerate({
    workspaceRoot: root,
    call: generateCall(),
    runPrompt: async ({ prompt }) => {
      const directory = prompt.match(/Directory: (.+)/)?.[1] ?? '.';

      const names = [...prompt.matchAll(/^- name: (.+)$/gm)].map(
        (match) => match[1]!,
      );

      return {
        sessionId: `generate-${directory}`,
        output: JSON.stringify({
          directory_summary: `Source responsibility for ${directory}.`,
          files: names.map((name) => ({
            name,
            source_summary: `Source summary for ${name}.`,
            enriched_summary: null,
          })),
          normalized_context: null,
          directory_enriched_summary: null,
        }),
      };
    },
  });
}

function index(
  root: string,
  path = '.',
): ReturnType<typeof BottomupIndexSchema.parse> {
  return BottomupIndexSchema.parse(
    JSON.parse(
      readFileSync(join(root, path, BOTTOMUP_INDEX_FILE), 'utf8'),
    ) as unknown,
  );
}

describe('bottomup.summarize', () => {
  test('is registered for CLI and AI tools', () => {
    expect(
      commandDefinition('/', 'file').subcommands.some(
        (subcommand) => subcommand.name === 'bottomup.summarize',
      ),
    ).toBe(true);

    expect(FileToolCallSchema.parse(summarizeCall()).type).toBe(
      'bottomup.summarize',
    );
  });

  test('builds summaries bottom-up from immediate child summaries', async () => {
    const root = workspace();
    await generate(root);
    const prompts: string[] = [];

    const result = await executeBottomupSummarize({
      workspaceRoot: root,
      call: summarizeCall(),
      runPrompt: async ({ prompt }) => {
        prompts.push(prompt);

        return {
          sessionId: 'summarize-root',
          output: JSON.stringify({
            summary: 'Root combines its entry point with the child feature.',
          }),
        };
      },
    });

    expect(result.type).toBe('written');

    if (result.type !== 'written') {
      return;
    }

    expect(result.aiCalls).toBe(1);
    expect(result.updated).toEqual(['child', '.']);

    expect(index(root, 'child').summary).toMatchObject({
      value: 'Source responsibility for child.',
      provenance: 'derived',
    });

    expect(index(root).summary?.value).toBe(
      'Root combines its entry point with the child feature.',
    );

    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toContain('summary: Source responsibility for child.');
    expect(prompts[0]).not.toContain('export const child');
    expect(prompts[0]).not.toContain('enriched');
  });

  test('skips hash-current summaries without AI calls or writes', async () => {
    const root = workspace();
    await generate(root);

    await executeBottomupSummarize({
      workspaceRoot: root,
      call: summarizeCall(),
      runPrompt: async () => ({
        sessionId: 'first',
        output: JSON.stringify({ summary: 'Current root summary.' }),
      }),
    });

    const before = readFileSync(join(root, BOTTOMUP_INDEX_FILE), 'utf8');

    const result = await executeBottomupSummarize({
      workspaceRoot: root,
      call: summarizeCall(),
      runPrompt: async () => {
        throw new Error('Current summaries should not invoke AI.');
      },
    });

    expect(result.type).toBe('written');

    if (result.type !== 'written') {
      return;
    }

    expect(result.updated).toEqual([]);
    expect(result.skipped).toEqual(['child', '.']);
    expect(result.aiCalls).toBe(0);
    expect(readFileSync(join(root, BOTTOMUP_INDEX_FILE), 'utf8')).toBe(before);
  });

  test('stores a partial summary and structured missing coverage by default', async () => {
    const root = workspace();
    await generate(root);
    mkdirSync(join(root, 'ungenerated'));

    writeFileSync(
      join(root, 'ungenerated', 'new.ts'),
      'export const value = 1;\n',
    );

    const result = await executeBottomupSummarize({
      workspaceRoot: root,
      call: summarizeCall(),
      runPrompt: async ({ prompt }) => ({
        sessionId: 'partial-root',
        output: JSON.stringify({
          summary: prompt.includes('ungenerated')
            ? 'Partial root summary.'
            : 'Child summary.',
        }),
      }),
    });

    expect(result.type).toBe('written');

    expect(index(root).coverage).toEqual({
      complete: false,
      missing: ['ungenerated'],
      stale: [],
    });

    expect(index(root).summary?.value).toBe('Partial root summary.');
  });

  test('strict mode rejects incomplete generation before AI work', async () => {
    const root = workspace();
    await generate(root);
    mkdirSync(join(root, 'ungenerated'));
    let aiCalls = 0;

    await expect(
      executeBottomupSummarize({
        workspaceRoot: root,
        call: summarizeCall({ no_partial: true }),
        runPrompt: async () => {
          aiCalls++;

          return { sessionId: 'unused', output: '{}' };
        },
      }),
    ).rejects.toThrow('missing: ungenerated');

    expect(aiCalls).toBe(0);
    expect(index(root).summary).toBeNull();
  });

  test('uses agent-supplied directory knowledge without an AI call', async () => {
    const root = workspace();
    await generate(root);

    const result = await executeBottomupSummarize({
      workspaceRoot: root,
      call: summarizeCall({
        agent_context: {
          context: null,
          files: {},
          directories: {
            '.': { source_summary: 'Agent-composed root summary.' },
            child: { source_summary: 'Agent-composed child summary.' },
          },
        },
      }),
      runPrompt: async () => {
        throw new Error('Complete agent summaries should avoid AI.');
      },
    });

    expect(result.type).toBe('written');

    if (result.type !== 'written') {
      return;
    }

    expect(result.aiCalls).toBe(0);

    expect(index(root).summary).toMatchObject({
      value: 'Agent-composed root summary.',
      provenance: 'agent',
    });
  });

  test('plans recursively without AI calls or writes', async () => {
    const root = workspace();
    await generate(root);

    const result = await executeBottomupSummarize({
      workspaceRoot: root,
      call: summarizeCall({ plan: true }),
      runPrompt: async () => {
        throw new Error('Plan must not invoke AI.');
      },
    });

    expect(result.type).toBe('plan');

    if (result.type !== 'plan') {
      return;
    }

    expect(result.plan.expectedAiCalls).toBe(1);

    expect(result.plan.affectedFiles).toEqual([
      'child/.BOTTOMUP.json',
      '.BOTTOMUP.json',
    ]);

    expect(index(root).summary).toBeNull();
  });

  test('does not propagate a coverage-only metadata repair as a summary change', async () => {
    const root = workspace();
    await generate(root);

    await executeBottomupSummarize({
      workspaceRoot: root,
      call: summarizeCall(),
      runPrompt: async () => ({
        sessionId: 'initial-root',
        output: JSON.stringify({ summary: 'Current root summary.' }),
      }),
    });

    const child = index(root, 'child');

    child.coverage = {
      complete: false,
      missing: ['child/removed'],
      stale: [],
    };

    writeFileSync(
      join(root, 'child', BOTTOMUP_INDEX_FILE),
      `${JSON.stringify(child, null, 2)}\n`,
    );

    const result = await executeBottomupSummarize({
      workspaceRoot: root,
      call: summarizeCall({ plan: true }),
    });

    if (result.type !== 'plan') {
      throw new Error('Expected summarize plan.');
    }

    expect(result.plan.expectedAiCalls).toBe(0);
    expect(result.plan.affectedFiles).toEqual(['child/.BOTTOMUP.json']);
  });

  test('accepts a stateless draft and rejects changed draft inputs', async () => {
    const root = workspace();
    await generate(root);

    const draft = await executeBottomupSummarize({
      workspaceRoot: root,
      draftAllowed: true,
      call: summarizeCall({ draft: true }),
      runPrompt: async () => ({
        sessionId: 'draft-root',
        output: JSON.stringify({ summary: 'Draft root summary.' }),
      }),
    });

    expect(draft.type).toBe('draft');

    if (draft.type !== 'draft') {
      return;
    }

    expect(index(root).summary).toBeNull();

    expect(
      acceptBottomupSummarizeDraft({ workspaceRoot: root, state: draft.state })
        .files,
    ).toHaveLength(2);

    expect(index(root).summary?.value).toBe('Draft root summary.');

    const nextDraft = await executeBottomupSummarize({
      workspaceRoot: root,
      draftAllowed: true,
      call: summarizeCall({ draft: true, prompt: 'Rewrite it.' }),
      runPrompt: async ({ sessionId }) => ({
        sessionId: sessionId ?? 'next-draft',
        output: JSON.stringify({ summary: 'Revised summary.' }),
      }),
    });

    if (nextDraft.type !== 'draft') {
      return;
    }

    writeFileSync(
      join(root, 'child', 'feature.ts'),
      'export const changed = true;\n',
    );

    expect(() =>
      acceptBottomupSummarizeDraft({
        workspaceRoot: root,
        state: nextDraft.state,
      }),
    ).toThrow('source changed under child');
  });

  test('reuses the matching worker session when revising a draft', async () => {
    const root = workspace();
    await generate(root);

    const draft = await executeBottomupSummarize({
      workspaceRoot: root,
      draftAllowed: true,
      call: summarizeCall({ draft: true }),
      runPrompt: async () => ({
        sessionId: 'root-session',
        output: JSON.stringify({ summary: 'Initial root summary.' }),
      }),
    });

    if (draft.type !== 'draft') {
      throw new Error('Expected summarize draft.');
    }

    const sessions: Array<string | null> = [];

    const revised = await reviseBottomupSummarizeDraft({
      workspaceRoot: root,
      state: draft.state,
      prompt: 'Make every summary more concise.',
      runPrompt: async ({ sessionId }) => {
        sessions.push(sessionId);

        return {
          sessionId: sessionId ?? 'child-session',
          output: JSON.stringify({ summary: 'Concise summary.' }),
        };
      },
    });

    expect(revised.updated).toEqual(['child', '.']);
    expect(sessions).toEqual([null, 'root-session']);
  });

  test('rejects a draft when the directory scope changes', async () => {
    const root = workspace();
    await generate(root);

    const draft = await executeBottomupSummarize({
      workspaceRoot: root,
      draftAllowed: true,
      call: summarizeCall({ draft: true }),
      runPrompt: async () => ({
        sessionId: 'scope-session',
        output: JSON.stringify({ summary: 'Draft summary.' }),
      }),
    });

    if (draft.type !== 'draft') {
      throw new Error('Expected summarize draft.');
    }

    mkdirSync(join(root, 'added'));

    expect(() =>
      acceptBottomupSummarizeDraft({
        workspaceRoot: root,
        state: draft.state,
      }),
    ).toThrow('directory scope changed during review');
  });
});

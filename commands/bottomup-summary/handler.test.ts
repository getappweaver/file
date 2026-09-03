import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { describe, expect, test } from 'bun:test';

import { WebRenderResultSchema } from '@src/web/ui-schema';

import {
  FileToolCallSchema,
  type BottomupEnrichCall,
  type BottomupGenerateCall,
  type BottomupSummarizeCall,
  type BottomupSummaryCall,
} from '../../ai/schema';
import { commandDefinition } from '../../definition';

import { executeBottomupEnrich } from '../bottomup-enrich/handler';
import { readIndex } from '../bottomup-generate/fs';
import { executeBottomupGenerate } from '../bottomup-generate/handler';
import { executeBottomupSummarize } from '../bottomup-summarize/handler';

import {
  defaultSummaryLocation,
  executeBottomupSummary,
  formatBottomupSummary,
  readBottomupSummary,
  saveBottomupSummary,
} from './handler';
import { renderBottomupSummaryPreview } from './renderers/web';

function workspace(): string {
  const root = mkdtempSync(join(tmpdir(), 'bottomup-summary-'));
  mkdirSync(join(root, 'child'));
  writeFileSync(join(root, 'index.ts'), 'export const ROOT_SENTINEL = true;\n');

  writeFileSync(
    join(root, 'child', 'feature.ts'),
    'export const CHILD_SENTINEL = true;\n',
  );

  return root;
}

function summaryCall(
  overrides: Partial<BottomupSummaryCall> = {},
): BottomupSummaryCall {
  return {
    type: 'bottomup.summary',
    path: '.',
    root: '.',
    format: 'markdown',
    parent_depth: 1,
    child_depth: 1,
    location: null,
    draft: false,
    ...overrides,
  };
}

async function generate(root: string): Promise<void> {
  const call: BottomupGenerateCall = {
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

  await executeBottomupGenerate({
    workspaceRoot: root,
    call,
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

async function summarize(root: string): Promise<void> {
  const call: BottomupSummarizeCall = {
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
    no_partial: true,
  };

  await executeBottomupSummarize({
    workspaceRoot: root,
    call,
    runPrompt: async () => ({
      sessionId: 'summarize-root',
      output: JSON.stringify({
        summary: 'Root coordinates the child feature.',
      }),
    }),
  });
}

async function enrich(root: string): Promise<void> {
  const call: BottomupEnrichCall = {
    type: 'bottomup.enrich',
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
    allow_partial: false,
    force: false,
    context: 'Workspace architecture.',
  };

  await executeBottomupEnrich({
    workspaceRoot: root,
    call,
    runPrompt: async ({ prompt }) => {
      const directory = prompt.match(/Directory: (.+)/)?.[1] ?? '.';

      return {
        sessionId: `enrich-${directory}`,
        output: JSON.stringify({
          directory_enriched_summary: `Architectural role for ${directory}.`,
          files: [],
        }),
      };
    },
  });
}

async function completeFixture(root: string): Promise<void> {
  await generate(root);
  await summarize(root);
  await enrich(root);
}

describe('bottomup.summary', () => {
  test('is registered for CLI and AI tools', () => {
    const subcommands = commandDefinition('/', 'file').subcommands;

    expect(
      subcommands.some((subcommand) => subcommand.name === 'bottomup.summary'),
    ).toBe(true);

    expect(FileToolCallSchema.parse(summaryCall()).type).toBe(
      'bottomup.summary',
    );

    for (const legacy of [
      'bottomup',
      'bottomup_context',
      'summarize',
      'topdown',
    ]) {
      expect(subcommands.some((subcommand) => subcommand.name === legacy)).toBe(
        false,
      );

      expect(FileToolCallSchema.safeParse({ type: legacy }).success).toBe(
        false,
      );
    }
  });

  test('renders current parent, local, child, and enrichment knowledge', async () => {
    const root = workspace();
    await completeFixture(root);

    const projection = readBottomupSummary({
      workspaceRoot: root,
      call: summaryCall({ path: 'child', child_depth: 0 }),
    });

    expect(projection.nodes.map((node) => node.relation)).toEqual([
      'parent',
      'current',
    ]);

    expect(projection.nodes[0]).toMatchObject({
      path: '.',
      summaryStatus: 'current',
      enrichmentStatus: 'current',
      summary: 'Root coordinates the child feature.',
    });

    expect(projection.nodes[1]).toMatchObject({
      path: 'child',
      summaryStatus: 'current',
      enrichmentStatus: 'current',
      sourceSummary: 'Source responsibility for child.',
      enrichedSummary: 'Architectural role for child.',
    });

    const markdown = formatBottomupSummary(projection, 'markdown');
    expect(markdown).not.toContain('ROOT_SENTINEL');
    expect(markdown).not.toContain('CHILD_SENTINEL');
    expect(markdown).toContain('Role in the System');
  });

  test('suppresses stale summary and enrichment after source changes', async () => {
    const root = workspace();
    await completeFixture(root);

    writeFileSync(
      join(root, 'child', 'feature.ts'),
      'export const changed = true;\n',
    );

    const projection = readBottomupSummary({
      workspaceRoot: root,
      call: summaryCall({ path: 'child', child_depth: 0 }),
    });

    const parent = projection.nodes[0]!;
    const child = projection.nodes[1]!;

    expect(parent.summaryStatus).toBe('stale');
    expect(parent.summary).toBeNull();

    expect(child).toMatchObject({
      sourceStatus: 'stale',
      summaryStatus: 'stale',
      enrichmentStatus: 'stale',
      summary: null,
      sourceSummary: null,
      enrichedSummary: null,
    });
  });

  test('reads one requested file without returning sibling file detail', async () => {
    const root = workspace();

    writeFileSync(
      join(root, 'child', 'other.ts'),
      'export const other = true;\n',
    );

    await completeFixture(root);

    const projection = readBottomupSummary({
      workspaceRoot: root,
      call: summaryCall({ path: 'child/feature.ts' }),
    });

    expect(projection.requestedFile).toBe('feature.ts');

    expect(projection.nodes.at(-1)?.files).toEqual([
      {
        path: 'child/feature.ts',
        status: 'current',
        sourceSummary: 'Source summary for feature.ts.',
        enrichedSummary: null,
      },
    ]);
  });

  test('returns a structured JSON projection', async () => {
    const root = workspace();
    await generate(root);
    await summarize(root);

    const output = executeBottomupSummary({
      workspaceRoot: root,
      call: summaryCall({ format: 'json' }),
    });

    const projection = JSON.parse(output) as { path: string; nodes: unknown[] };

    expect(projection.path).toBe('.');
    expect(projection.nodes).toHaveLength(2);
  });

  test('renders draft previews recursively with hierarchical headers and files', async () => {
    const root = workspace();
    mkdirSync(join(root, 'child', 'grandchild'));

    writeFileSync(
      join(root, 'child', 'grandchild', 'deep.ts'),
      'export const deep = true;\n',
    );

    await generate(root);
    await summarize(root);

    const projection = readBottomupSummary({
      workspaceRoot: root,
      call: summaryCall({ draft: true, child_depth: null }),
    });

    const markdown = formatBottomupSummary(projection, 'markdown');

    expect(projection.nodes.map((node) => node.path)).toEqual([
      '.',
      'child',
      'child/grandchild',
    ]);

    expect(markdown).toContain('## .');
    expect(markdown).toContain('### child');
    expect(markdown).toContain('#### child/grandchild');
    expect(markdown).toContain('child/feature.ts');
    expect(markdown).toContain('child/grandchild/deep.ts');
    expect(markdown).not.toContain('Current:');
    expect(markdown).not.toContain('Child:');
  });

  test('exports projections safely without invalidating generation', async () => {
    const root = workspace();
    await generate(root);
    await summarize(root);

    const projection = readBottomupSummary({
      workspaceRoot: root,
      call: summaryCall({ path: 'child' }),
    });

    const content = formatBottomupSummary(projection, 'markdown');

    const location = defaultSummaryLocation({
      projection,
      format: 'markdown',
    });

    expect(location).toBe('child/BOTTOMUP_SUMMARY.md');

    expect(
      saveBottomupSummary({ workspaceRoot: root, location, content }),
    ).toBe(location);

    expect(readFileSync(join(root, location), 'utf8')).toBe(content);

    await executeBottomupGenerate({
      workspaceRoot: root,
      call: {
        type: 'bottomup.generate',
        path: 'child',
        root: '.',
        respect_gitignore: true,
        include_hidden: false,
        extra_ignore: [],
        model: null,
        prompt: null,
        agent_context: null,
        draft: false,
        plan: false,
        recursive: false,
        enrich: false,
        context: null,
      },
      runPrompt: async () => {
        throw new Error('Export files must not invalidate source generation.');
      },
    });

    expect(() =>
      saveBottomupSummary({
        workspaceRoot: root,
        location: '../outside.md',
        content,
      }),
    ).toThrow('escapes the workspace');

    expect(() =>
      saveBottomupSummary({
        workspaceRoot: root,
        location: '.BOTTOMUP.json',
        content,
      }),
    ).toThrow('canonical index');
  });

  test('renders a readable web preview with optional save controls', async () => {
    const root = workspace();
    await generate(root);

    const projection = readBottomupSummary({
      workspaceRoot: root,
      call: summaryCall(),
    });

    const content = formatBottomupSummary(projection, 'markdown');

    const preview = renderBottomupSummaryPreview({
      command: 'file',
      content,
      defaultLocation: 'BOTTOMUP_SUMMARY.md',
      state: 'state',
      format: 'markdown',
    });

    expect(WebRenderResultSchema.parse(preview)).toBeDefined();
    expect(JSON.stringify(preview)).toContain('bottomup.summary.save');
    expect(JSON.stringify(preview)).toContain('BOTTOMUP_SUMMARY.md');
  });

  test('reads old indexes without a summary field', () => {
    const root = workspace();

    writeFileSync(
      join(root, '.BOTTOMUP.json'),
      JSON.stringify({
        schemaVersion: 1,
        path: '.',
        scope: { root: true },
        source: {
          version: 1,
          inputHash: 'invalid-until-replaced',
          directorySummary: 'Stored source summary.',
          files: {},
        },
        children: {},
        coverage: { complete: true, missing: [], stale: [] },
        context: null,
        enrichment: null,
      }),
    );

    expect(readIndex(root)?.summary).toBeNull();
  });
});

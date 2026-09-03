import { describe, expect, test } from 'bun:test';

import { WebRenderResultSchema, type WebNode } from '@src/web/ui-schema';

import { renderBottomupEnrichDraft } from '../../bottomup-enrich/renderers/web';
import { renderBottomupSummarizeDraft } from '../../bottomup-summarize/renderers/web';

import { renderBottomupGenerateDraft } from './web';

function containsDiffPatch(node: WebNode): boolean {
  return (
    (node.type === 'element' && node.tag === 'diffPatch') ||
    (node.type === 'element' && (node.children ?? []).some(containsDiffPatch))
  );
}

describe('bottom-up draft renderers', () => {
  test('use the shared diff patch WebNode', () => {
    const generate = renderBottomupGenerateDraft({
      command: 'file',
      draft: {
        type: 'draft',
        root: 'plugins/file',
        path: 'plugins/file/commands/commit',
        filePath: 'plugins/file/commands/commit/.BOTTOMUP.json',
        baseHash: null,
        proposed: '{}\n',
        diff: '@@ -1 +1 @@\n-old\n+new',
        aiCalls: 1,
        state: 'state',
      },
    });

    const summarize = renderBottomupSummarizeDraft({
      command: 'file',
      draft: {
        type: 'draft',
        root: 'plugins/file',
        updated: ['plugins/file/commands'],
        skipped: [],
        missing: [],
        stale: [],
        aiCalls: 1,
        diff: '@@ -1 +1 @@\n-old\n+new',
        state: 'state',
      },
    });

    const enrich = renderBottomupEnrichDraft({
      command: 'file',
      draft: {
        type: 'draft',
        root: 'plugins/file',
        updated: ['plugins/file/commands'],
        skipped: [],
        missing: [],
        stale: [],
        blocked: [],
        missingSummaries: [],
        staleSummaries: [],
        aiCalls: 1,
        diff: '@@ -1 +1 @@\n-old\n+new',
        state: 'state',
      },
    });

    for (const root of [generate, summarize, enrich]) {
      expect(WebRenderResultSchema.parse(root)).toBeDefined();
      expect(containsDiffPatch(root.tree)).toBe(true);
    }
  });
});

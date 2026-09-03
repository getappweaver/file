import type { WebAction, WebNode, WebNodeRoot } from '@src/web/ui-schema';

import type { GenerateResult } from '../types';

type GenerateDraft = Extract<GenerateResult, { type: 'draft' }>;

function commandAction(params: {
  command: string;
  subcommand: string;
  options: Record<string, unknown>;
}): WebAction {
  return {
    type: 'command',
    command: params.command,
    subcommand: params.subcommand,
    arguments: {},
    options: params.options,
    recordInTimeline: false,
    surface: 'modal',
    modalTitle: 'Bottom-up generation draft',
  };
}

function reviewActions(command: string, draft: GenerateDraft): WebNode {
  return {
    type: 'element',
    tag: 'row',
    props: { gap: 'sm' },
    children: [
      {
        type: 'element',
        tag: 'button',
        props: {
          label: 'Accept',
          tone: 'success',
          action: commandAction({
            command,
            subcommand: 'bottomup.generate.accept',
            options: { state: draft.state },
          }),
        },
      },
      {
        type: 'element',
        tag: 'button',
        props: {
          label: 'Decline',
          tone: 'danger',
          action: {
            type: 'clientAction',
            action: 'web.closeModal',
            payload: {},
          },
        },
      },
    ],
  };
}

function revisionForm(command: string, draft: GenerateDraft): WebNode {
  return {
    type: 'element',
    tag: 'form',
    props: {
      className: 'bottomup-generate-revision',
      formOptionFieldNames: ['prompt'],
      action: commandAction({
        command,
        subcommand: 'bottomup.generate.revise',
        options: { state: draft.state },
      }),
    },
    children: [
      {
        type: 'element',
        tag: 'textArea',
        props: {
          formFieldName: 'prompt',
          inputPlaceholder: 'Describe how this draft should change…',
          maxRows: 8,
        },
      },
      {
        type: 'element',
        tag: 'button',
        props: { label: 'Revise', htmlType: 'submit' },
      },
    ],
  };
}

export function renderBottomupGenerateDraft(params: {
  command: string;
  draft: GenerateDraft;
}): WebNodeRoot {
  return {
    kind: 'ui',
    version: 1,
    meta: {
      command: params.command,
      subcommand: 'bottomup.generate',
      arguments: {},
      options: { path: params.draft.path, draft: true },
    },
    tree: {
      type: 'element',
      tag: 'stack',
      props: { gap: 'md', padding: 'md' },
      children: [
        {
          type: 'element',
          tag: 'text',
          props: { weight: 'bold', size: 'lg' },
          children: [{ type: 'text', value: params.draft.filePath }],
        },
        {
          type: 'element',
          tag: 'text',
          props: { tone: 'muted', size: 'sm' },
          children: [
            {
              type: 'text',
              value: `Root: ${params.draft.root} · AI calls: ${params.draft.aiCalls}`,
            },
          ],
        },
        {
          type: 'element',
          tag: 'diffPatch',
          props: {
            className: 'bottomup-generate-diff',
            diffPatch: params.draft.diff,
            diffFilePath: params.draft.filePath,
          },
        },
        revisionForm(params.command, params.draft),
        reviewActions(params.command, params.draft),
      ],
    },
    stylesheets: [
      {
        id: 'bottomup-generate-draft',
        cssText: `
          .bottomup-generate-diff {
            max-height: 26rem;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 0.78rem;
            line-height: 1.45;
          }
          .bottomup-generate-revision { display: grid; gap: 0.65rem; }
        `,
      },
    ],
    shadowMountOverflow: 'hidden',
  };
}

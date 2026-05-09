import type {
  StoryChatState,
  StoryDefinition,
} from '@src/system/story-definition';

import type { FileDiffOk } from './commands/diff/handler';
import { renderFileDiffWeb } from './commands/diff/renderers/web';
import { renderFileTreeBrowserWeb } from './commands/tree/renderers/web';
import type { ListWorkspaceDirectoryResult } from './commands/tree/workspace-tree';
import type { FileViewOk } from './commands/view/handler';
import { renderFileViewWeb } from './commands/view/renderers/web';

type FileStoryState = {
  chat: StoryChatState;
};

const demoTree = {
  type: 'ok',
  displayPath: '.',
  rows: [
    {
      name: 'docs',
      relativePosix: 'docs',
      isDirectory: true,
      hasChildren: true,
      loaded: true,
      git: null,
      treePrefix: '',
      connector: '├── ',
    },
    {
      name: 'DEMO_SYSTEM.md',
      relativePosix: 'docs/DEMO_SYSTEM.md',
      isDirectory: false,
      hasChildren: false,
      loaded: false,
      git: null,
      treePrefix: '│   ',
      connector: '└── ',
    },
    {
      name: 'README.md',
      relativePosix: 'README.md',
      isDirectory: false,
      hasChildren: false,
      loaded: false,
      git: { kind: 'modified', label: 'M', scope: 'file' },
      treePrefix: '',
      connector: '└── ',
    },
  ],
} satisfies ListWorkspaceDirectoryResult;

const demoMarkdownView = {
  type: 'ok',
  relativePath: 'docs/DEMO_SYSTEM.md',
  content: `# Demo System

Stories are small guided walkthroughs that can run inside the app and in the landing page demo.

They combine scripted command outputs with live web UI actions, so a plugin can teach its own workflow without depending on real workspace state.

This file view is rendered by the File plugin markdown/code reader.`,
  truncated: false,
  binary: false,
  byteLength: 318,
} satisfies FileViewOk;

const demoDiff = {
  type: 'ok',
  relativePath: 'README.md',
  truncated: false,
  binary: false,
  lines: [
    {
      kind: 'header',
      oldLine: null,
      newLine: null,
      text: 'diff --git a/README.md b/README.md',
    },
    {
      kind: 'header',
      oldLine: null,
      newLine: null,
      text: 'index 7b3a20a..a91c15e 100644',
    },
    { kind: 'header', oldLine: null, newLine: null, text: '--- a/README.md' },
    { kind: 'header', oldLine: null, newLine: null, text: '+++ b/README.md' },
    {
      kind: 'hunk',
      oldLine: null,
      newLine: null,
      text: '@@ -12,6 +12,9 @@ AppWeaver',
    },
    {
      kind: 'context',
      oldLine: 12,
      newLine: 12,
      text: ' - Install apps as plugins',
    },
    {
      kind: 'context',
      oldLine: 13,
      newLine: 13,
      text: ' - Run agent workflows from chat',
    },
    {
      kind: 'add',
      oldLine: null,
      newLine: 14,
      text: '+- Preview plugin stories in the web demo',
    },
    {
      kind: 'add',
      oldLine: null,
      newLine: 15,
      text: '+- Browse files with markdown and diff views',
    },
    {
      kind: 'context',
      oldLine: 14,
      newLine: 16,
      text: ' - Keep all changes reviewable',
    },
  ],
} satisfies FileDiffOk;

function buildTreeOutput(params: {
  alias: string;
}): NonNullable<StoryDefinition<FileStoryState>['commandOutput']> {
  return {
    text: null,
    web: renderFileTreeBrowserWeb({
      commandAlias: params.alias,
      list: demoTree,
      extOption: null,
      expandedPaths: new Set(['docs']),
    }),
    clientView: null,
  };
}

function buildViewOutput(params: {
  alias: string;
}): NonNullable<StoryDefinition<FileStoryState>['commandOutput']> {
  return {
    text: null,
    web: renderFileViewWeb({
      commandAlias: params.alias,
      result: demoMarkdownView,
      previousDir: '.',
      highlightLine: null,
    }),
    clientView: null,
  };
}

function buildDiffOutput(params: {
  alias: string;
}): NonNullable<StoryDefinition<FileStoryState>['commandOutput']> {
  return {
    text: null,
    web: renderFileDiffWeb({
      commandAlias: params.alias,
      result: demoDiff,
      previousDir: '.',
    }),
    clientView: null,
  };
}

function baseSandbox(params: { alias: string }) {
  return {
    __outputs: {
      [`${params.alias}:tree`]: [buildTreeOutput({ alias: params.alias }).web],
      [`${params.alias}:view`]: [buildViewOutput({ alias: params.alias }).web],
      [`${params.alias}:diff`]: [buildDiffOutput({ alias: params.alias }).web],
    },
  };
}

function buildReadMarkdownStory(params: {
  prefix: string;
  alias: string;
}): StoryDefinition<FileStoryState> {
  const story: StoryDefinition<FileStoryState> = {
    id: 'file-tree-read-markdown',
    title: 'Read markdown from the file tree',
    description:
      'Use the File widget tree to open a markdown document in the built-in reader.',
    showcase: {
      title: 'The workspace tree is an app surface',
      description:
        'Browse project files, expand folders, and open markdown or code without leaving the chat-native UI.',
      timing: {
        initialDelayMs: 900,
        stepDelayMs: 1900,
        storyDelayMs: 2500,
      },
    },
    kind: 'command',
    initialState: { chat: { messages: [] } },
    sandbox: baseSandbox({ alias: params.alias }),
    steps: [
      {
        type: 'instruction',
        text: 'Open the Files widget from the header to browse the workspace tree.',
        showcase: {
          title: 'Files are navigable inside the app',
          description:
            'The tree widget can be used as a compact workspace browser in demos and real sessions.',
        },
      },
      {
        type: 'focus_target',
        target: {
          type: 'header_widget',
          command: params.alias,
          subcommand: 'tree',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'widget_opened',
          command: params.alias,
          subcommand: 'tree',
        },
      },
      {
        type: 'instruction',
        text: 'Click DEMO_SYSTEM.md to open it in the markdown reader.',
        showcase: {
          title: 'Tree rows can launch follow-up commands',
          description:
            'A file row opens the File plugin reader with syntax highlighting for markdown and code.',
        },
      },
      {
        type: 'focus_target',
        target: {
          type: 'web_node',
          targetId: 'file-tree-open-docs_DEMO_SYSTEM_md',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'target_clicked',
          targetId: 'file-tree-open-docs_DEMO_SYSTEM_md',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'command_completed',
          command: params.alias,
          subcommand: 'view',
        },
      },
      {
        type: 'complete',
        cleanup: {
          closeWidgets: [
            {
              command: params.alias,
              subcommand: 'tree',
            },
          ],
        },
      },
    ],
  };

  story.commandOutput = buildViewOutput({ alias: params.alias });

  return story;
}

function buildGitDiffStory(params: {
  prefix: string;
  alias: string;
}): StoryDefinition<FileStoryState> {
  const story: StoryDefinition<FileStoryState> = {
    id: 'file-tree-git-diff',
    title: 'Open a git diff from the tree',
    description:
      'Use the File widget tree git badge to inspect a modified file diff.',
    showcase: {
      title: 'Git status is visible in the tree',
      description:
        'Modified files carry status badges that jump directly into a focused diff view.',
      timing: {
        initialDelayMs: 900,
        stepDelayMs: 1900,
        storyDelayMs: 2500,
      },
    },
    kind: 'command',
    initialState: { chat: { messages: [] } },
    sandbox: baseSandbox({ alias: params.alias }),
    steps: [
      {
        type: 'instruction',
        text: 'Open the Files widget from the header to inspect git status.',
        showcase: {
          title: 'Workspace state is visible at a glance',
          description:
            'The same tree can show clean files, modified files, and diff actions.',
        },
      },
      {
        type: 'focus_target',
        target: {
          type: 'header_widget',
          command: params.alias,
          subcommand: 'tree',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'widget_opened',
          command: params.alias,
          subcommand: 'tree',
        },
      },
      {
        type: 'instruction',
        text: 'Click the modified badge beside README.md to open its diff.',
        showcase: {
          title: 'Diffs are one click away',
          description:
            'A git badge on a file row opens the diff renderer for review.',
        },
      },
      {
        type: 'focus_target',
        target: {
          type: 'web_node',
          targetId: 'file-tree-diff-README_md',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'target_clicked',
          targetId: 'file-tree-diff-README_md',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'command_completed',
          command: params.alias,
          subcommand: 'diff',
        },
      },
      {
        type: 'complete',
        cleanup: {
          closeWidgets: [
            {
              command: params.alias,
              subcommand: 'tree',
            },
          ],
        },
      },
    ],
  };

  story.commandOutput = buildDiffOutput({ alias: params.alias });

  return story;
}

export function fileStories(
  prefix: string,
  alias: string,
): StoryDefinition<unknown>[] {
  return [
    buildReadMarkdownStory({ prefix, alias }),
    buildGitDiffStory({ prefix, alias }),
  ];
}

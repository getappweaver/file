import type {
  StoryChatState,
  StoryDefinition,
} from '@src/system/story-definition';
import type { TimelineEventOutput } from '@src/web/ui-schema';

import type { FileDiffOk } from './commands/diff/handler';
import { renderFileDiffWeb } from './commands/diff/renderers/web';
import type { FileHistoryResult } from './commands/history/handler';
import { renderFileHistoryWeb } from './commands/history/renderers/web';
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
      git: null,
      treePrefix: '',
      connector: '└── ',
    },
  ],
} satisfies ListWorkspaceDirectoryResult;

const demoEditedTree = {
  ...demoTree,
  rows: demoTree.rows.map((row) =>
    row.relativePosix === 'docs/DEMO_SYSTEM.md'
      ? { ...row, git: { kind: 'modified', label: 'M', scope: 'file' } }
      : row,
  ),
} satisfies ListWorkspaceDirectoryResult;

const demoDiffTree = {
  ...demoTree,
  rows: demoTree.rows.map((row) =>
    row.relativePosix === 'README.md' ||
    row.relativePosix === 'docs/DEMO_SYSTEM.md'
      ? { ...row, git: { kind: 'modified', label: 'M', scope: 'file' } }
      : row,
  ),
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

const demoEditedMarkdownView = {
  type: 'ok',
  relativePath: 'docs/DEMO_SYSTEM.md',
  content: `# Demo System

Stories are small guided walkthroughs that can run inside the app and in the landing page demo.

They combine scripted command outputs with live web UI actions, so a plugin can teach its own workflow without depending on real workspace state.

This file view is rendered by the File plugin markdown/code reader.

File edits can be reviewed from the same workflow before committing.`,
  truncated: false,
  binary: false,
  byteLength: 389,
} satisfies FileViewOk;

const demoMarkdownDiff = {
  type: 'ok',
  relativePath: 'docs/DEMO_SYSTEM.md',
  truncated: false,
  binary: false,
  lines: [
    {
      kind: 'header',
      oldLine: null,
      newLine: null,
      text: 'diff --git a/docs/DEMO_SYSTEM.md b/docs/DEMO_SYSTEM.md',
    },
    {
      kind: 'header',
      oldLine: null,
      newLine: null,
      text: 'index 6e20baf..c49de21 100644',
    },
    {
      kind: 'header',
      oldLine: null,
      newLine: null,
      text: '--- a/docs/DEMO_SYSTEM.md',
    },
    {
      kind: 'header',
      oldLine: null,
      newLine: null,
      text: '+++ b/docs/DEMO_SYSTEM.md',
    },
    {
      kind: 'hunk',
      oldLine: null,
      newLine: null,
      text: '@@ -5,3 +5,5 @@ They combine scripted command outputs with live web UI actions, so a plugin',
    },
    {
      kind: 'context',
      oldLine: 5,
      newLine: 5,
      text: ' This file view is rendered by the File plugin markdown/code reader.',
    },
    {
      kind: 'add',
      oldLine: null,
      newLine: 7,
      text: '+',
    },
    {
      kind: 'add',
      oldLine: null,
      newLine: 8,
      text: '+File edits can be reviewed from the same workflow before committing.',
    },
  ],
} satisfies FileDiffOk;

const demoReadmeDiff = {
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

const demoTimelineDiff = {
  kind: 'timeline_event',
  version: 1,
  event: {
    type: 'diff',
    title: '.',
    subtitle: 'working tree',
    origin: 'workspace_diff',
    scopePath: '.',
    stagedFiles: ['README.md', 'docs/DEMO_SYSTEM.md'],
    files: [
      {
        file: 'README.md',
        status: 'modified',
        additions: 2,
        deletions: 0,
        patch: `diff --git a/README.md b/README.md
index 7b3a20a..a91c15e 100644
--- a/README.md
+++ b/README.md
@@ -12,6 +12,8 @@ AppWeaver
 - Install apps as plugins
 - Run agent workflows from chat
+- Preview plugin stories in the web demo
+- Browse files with markdown and diff views
 - Keep all changes reviewable`,
      },
      {
        file: 'docs/DEMO_SYSTEM.md',
        status: 'modified',
        additions: 2,
        deletions: 0,
        patch: `diff --git a/docs/DEMO_SYSTEM.md b/docs/DEMO_SYSTEM.md
index 6e20baf..c49de21 100644
--- a/docs/DEMO_SYSTEM.md
+++ b/docs/DEMO_SYSTEM.md
@@ -5,3 +5,5 @@ They combine scripted command outputs with live web UI actions, so a plugin
 This file view is rendered by the File plugin markdown/code reader.
+
+File edits can be reviewed from the same workflow before committing.`,
      },
    ],
  },
} satisfies TimelineEventOutput;

const demoCommitTimelineDiff = {
  ...demoTimelineDiff,
  event: {
    ...demoTimelineDiff.event,
    title: 'Refresh file docs demo',
    subtitle: 'just now',
    origin: 'git_commit',
    stagedFiles: [],
  },
} satisfies TimelineEventOutput;

const demoHistory = {
  type: 'ok',
  relativePath: '.',
  commits: [
    {
      hash: 'a1b2c3d',
      relativeTime: 'just now',
      author: 'AppWeaver Demo',
      subject: 'Refresh file docs demo',
      fileCount: 2,
      additions: 4,
      deletions: 0,
    },
    {
      hash: '7f6e5d4',
      relativeTime: '2 hours ago',
      author: 'AppWeaver Demo',
      subject: 'Document story playback controls',
      fileCount: 1,
      additions: 12,
      deletions: 3,
    },
  ],
} satisfies FileHistoryResult;

function buildTreeOutput(params: {
  alias: string;
  list: ListWorkspaceDirectoryResult;
}): NonNullable<StoryDefinition<FileStoryState>['commandOutput']> {
  return {
    text: null,
    web: renderFileTreeBrowserWeb({
      commandAlias: params.alias,
      list: params.list,
      extOption: null,
      expandedPaths: new Set(['docs']),
      revealPath: null,
    }),
    clientView: null,
  };
}

function buildViewOutput(params: {
  alias: string;
  result: FileViewOk;
}): NonNullable<StoryDefinition<FileStoryState>['commandOutput']> {
  return {
    text: null,
    web: renderFileViewWeb({
      commandAlias: params.alias,
      result: params.result,
      previousDir: '.',
      highlightLine: null,
      lineScrollToken: null,
    }),
    clientView: null,
  };
}

function buildDiffOutput(params: {
  alias: string;
  result: FileDiffOk;
}): NonNullable<StoryDefinition<FileStoryState>['commandOutput']> {
  return {
    text: null,
    web: renderFileDiffWeb({
      commandAlias: params.alias,
      result: params.result,
      previousDir: '.',
    }),
    clientView: null,
  };
}

function buildHistoryOutput(params: {
  alias: string;
  result: FileHistoryResult;
}): NonNullable<StoryDefinition<FileStoryState>['commandOutput']> {
  return {
    text: null,
    web: renderFileHistoryWeb({
      commandAlias: params.alias,
      result: params.result,
    }),
    clientView: null,
  };
}

function baseSandbox(params: { alias: string }) {
  return {
    __outputs: {
      [`${params.alias}:tree`]: [
        buildTreeOutput({ alias: params.alias, list: demoTree }).web,
        buildTreeOutput({ alias: params.alias, list: demoEditedTree }).web,
      ],
      [`${params.alias}:view`]: [
        buildViewOutput({ alias: params.alias, result: demoMarkdownView }).web,
      ],
      [`${params.alias}:diff`]: [
        buildDiffOutput({ alias: params.alias, result: demoMarkdownDiff }).web,
      ],
    },
  };
}

function buildEditAndDiffStory(params: {
  prefix: string;
  alias: string;
}): StoryDefinition<FileStoryState> {
  const story: StoryDefinition<FileStoryState> = {
    id: 'file-tree-edit-diff-markdown',
    title: 'Edit markdown and check the diff',
    description:
      'Open a markdown file from the tree, save an edit, and review the resulting diff.',
    showcase: {
      title: 'Files can be edited in place',
      description:
        'Browse files, switch into edit mode, save changes, and jump straight into diff review without leaving the app.',
      timing: {
        initialDelayMs: 900,
        stepDelayMs: 1900,
        storyDelayMs: 2500,
      },
    },
    kind: 'command',
    initialState: { chat: { messages: [] } },
    sandbox: {
      __outputs: {
        [`${params.alias}:tree`]: [
          buildTreeOutput({ alias: params.alias, list: demoTree }).web,
          buildTreeOutput({ alias: params.alias, list: demoEditedTree }).web,
        ],
        [`${params.alias}:view`]: [
          buildViewOutput({ alias: params.alias, result: demoMarkdownView })
            .web,
          buildViewOutput({
            alias: params.alias,
            result: demoEditedMarkdownView,
          }).web,
        ],
        [`${params.alias}:edit`]: ['Updated docs/DEMO_SYSTEM.md'],
        [`${params.alias}:diff`]: [
          buildDiffOutput({ alias: params.alias, result: demoMarkdownDiff })
            .web,
        ],
      },
      __transitions: [
        {
          on: { command: params.alias, subcommand: 'edit' },
          advanceOutputs: [
            { command: params.alias, subcommand: 'view' },
            { command: params.alias, subcommand: 'tree' },
          ],
        },
      ],
    },
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
        type: 'instruction',
        text: 'Use the toolbar to switch the reader into edit mode.',
        showcase: {
          title: 'The reader can become an editor',
          description:
            'The same file card exposes an edit/save toggle for quick workspace changes.',
        },
      },
      {
        type: 'focus_target',
        target: {
          type: 'web_node',
          targetId: 'file-view-edit-docs/DEMO_SYSTEM.md',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'target_clicked',
          targetId: 'file-view-edit-docs/DEMO_SYSTEM.md',
        },
      },
      {
        type: 'fill_form',
        targetId: 'file-view-edit-text-docs/DEMO_SYSTEM.md',
        values: {
          arguments: { content: demoEditedMarkdownView.content },
          options: {},
        },
      },
      {
        type: 'instruction',
        text: 'Save the edited file to refresh the reader with the updated content.',
        showcase: {
          title: 'Save refreshes the file card',
          description:
            'After saving, the reader returns with the edited markdown and a focused line refresh.',
        },
      },
      {
        type: 'focus_target',
        target: {
          type: 'web_node',
          targetId: 'file-view-edit-docs/DEMO_SYSTEM.md',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'target_clicked',
          targetId: 'file-view-edit-docs/DEMO_SYSTEM.md',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'command_completed',
          command: params.alias,
          subcommand: 'edit',
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
        type: 'instruction',
        text: 'Open the file diff to inspect exactly what changed.',
        showcase: {
          title: 'Diff review is one click away',
          description:
            'The edited file can jump directly into a focused diff view for review.',
        },
      },
      {
        type: 'focus_target',
        target: {
          type: 'web_node',
          targetId: 'file-view-diff-docs/DEMO_SYSTEM.md',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'target_clicked',
          targetId: 'file-view-diff-docs/DEMO_SYSTEM.md',
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

  story.commandOutput = buildViewOutput({
    alias: params.alias,
    result: demoMarkdownView,
  });

  return story;
}

function buildReviewAndCommitStory(params: {
  prefix: string;
  alias: string;
}): StoryDefinition<FileStoryState> {
  const story: StoryDefinition<FileStoryState> = {
    id: 'file-tree-review-commit-diff',
    title: 'Review multiple file changes and commit',
    description:
      'Open a workspace diff card, review multiple changed files, and commit the selected set.',
    showcase: {
      title: 'Diff cards can become commits',
      description:
        'Review changed files together, keep the selected set explicit, and commit from the diff card.',
      timing: {
        initialDelayMs: 900,
        stepDelayMs: 1900,
        storyDelayMs: 2500,
      },
    },
    kind: 'command',
    initialState: { chat: { messages: [] } },
    sandbox: {
      ...baseSandbox({ alias: params.alias }),
      __outputs: {
        ...baseSandbox({ alias: params.alias }).__outputs,
        [`${params.alias}:tree`]: [
          buildTreeOutput({ alias: params.alias, list: demoDiffTree }).web,
        ],
        [`${params.alias}:diff`]: [demoTimelineDiff],
        [`${params.alias}:commit`]: [
          'Committed a1b2c3d.\n2 files included.\n[main a1b2c3d] Refresh file docs demo',
        ],
      },
    },
    steps: [
      {
        type: 'instruction',
        text: 'Open the File tree widget from the header.',
        showcase: {
          title: 'Start from the workspace tree',
          description:
            'The File widget is the launch point for workspace review flows.',
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
        text: 'Open the workspace diff card for all changed files.',
        showcase: {
          title: 'Changed files are grouped together',
          description:
            'A timeline diff card can summarize multiple workspace changes in one review surface.',
        },
      },
      {
        type: 'focus_target',
        target: {
          type: 'web_node',
          targetId: 'file-tree-diff-.',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'target_clicked',
          targetId: 'file-tree-diff-.',
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
        type: 'instruction',
        text: 'Expand README.md to see the changes.',
        showcase: {
          title: 'Each file can be reviewed independently',
          description:
            'The card keeps file-level patches collapsed until you need the details.',
        },
      },
      {
        type: 'focus_target',
        target: {
          type: 'web_node',
          targetId: 'diff-card-file-README.md',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'target_clicked',
          targetId: 'diff-card-file-README.md',
        },
      },
      {
        type: 'scroll_to_bottom',
      },
      {
        type: 'instruction',
        text: 'Expand DEMO_SYSTEM.md to see its changes.',
        showcase: {
          title: 'Multi-file review stays compact',
          description:
            'Review another file in the same card without leaving the commit context.',
        },
      },
      {
        type: 'focus_target',
        target: {
          type: 'web_node',
          targetId: 'diff-card-file-docs/DEMO_SYSTEM.md',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'target_clicked',
          targetId: 'diff-card-file-docs/DEMO_SYSTEM.md',
        },
      },
      {
        type: 'scroll_to_bottom',
      },
      {
        type: 'instruction',
        text: 'Fill the commit form with "Refresh file docs demo".',
        showcase: {
          title: 'Selected files define the commit',
          description:
            'The card carries selected files and an explicit commit message into the commit command.',
        },
      },
      {
        type: 'fill_form',
        targetId: 'diff-card-commit-message',
        values: {
          arguments: { message: 'Refresh file docs demo' },
          options: {},
        },
      },
      {
        type: 'instruction',
        text: 'Click Commit to save the selected file changes.',
        showcase: {
          title: 'Commit from the review card',
          description:
            'The commit button runs the selected-file commit with the filled message.',
        },
      },
      {
        type: 'focus_target',
        target: {
          type: 'web_node',
          targetId: 'diff-card-commit-submit',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'target_clicked',
          targetId: 'diff-card-commit-submit',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'command_completed',
          command: params.alias,
          subcommand: 'commit',
        },
      },
      {
        type: 'scroll_to_bottom',
      },
      {
        type: 'instruction',
        text: 'See the commit result message in the timeline.',
        showcase: {
          title: 'The review card confirms the commit',
          description:
            'The commit status confirms the hash and the exact commit message without leaving review context.',
        },
      },
      {
        type: 'focus_target',
        target: {
          type: 'web_node',
          targetId: 'diff-card-commit-status',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'target_clicked',
          targetId: 'diff-card-commit-status',
        },
      },
      {
        type: 'complete',
      },
    ],
  };

  story.commandOutput = buildDiffOutput({
    alias: params.alias,
    result: demoReadmeDiff,
  });

  return story;
}

function buildHistoryCommitDiffStory(params: {
  prefix: string;
  alias: string;
}): StoryDefinition<FileStoryState> {
  const story: StoryDefinition<FileStoryState> = {
    id: 'file-tree-history-commit-diff',
    title: 'Check commit history and inspect a diff',
    description:
      'Open workspace history, pick a commit, and review the files changed by that commit.',
    showcase: {
      title: 'History links back to diffs',
      description:
        'The File plugin can show recent commits for a path and open any commit as a reviewable diff card.',
      timing: {
        initialDelayMs: 900,
        stepDelayMs: 1900,
        storyDelayMs: 2500,
      },
    },
    kind: 'command',
    initialState: { chat: { messages: [] } },
    sandbox: {
      ...baseSandbox({ alias: params.alias }),
      __outputs: {
        ...baseSandbox({ alias: params.alias }).__outputs,
        [`${params.alias}:history`]: [
          buildHistoryOutput({ alias: params.alias, result: demoHistory }).web,
        ],
        [`${params.alias}:diff`]: [demoCommitTimelineDiff],
      },
    },
    steps: [
      {
        type: 'instruction',
        text: 'Open the Files widget from the header to browse the workspace tree.',
        showcase: {
          title: 'History starts from the file tree',
          description:
            'The same compact tree toolbar can jump from the current folder into commit history.',
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
        text: 'Click the history button to list recent commits for this workspace.',
        showcase: {
          title: 'The tree toolbar exposes history',
          description:
            'History is available beside create, search, and diff actions for the current folder.',
        },
      },
      {
        type: 'focus_target',
        target: {
          type: 'web_node',
          targetId: 'file-tree-history-.',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'target_clicked',
          targetId: 'file-tree-history-.',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'command_completed',
          command: params.alias,
          subcommand: 'history',
        },
      },
      {
        type: 'instruction',
        text: 'Click the "Refresh file docs demo" commit to inspect its diff.',
        showcase: {
          title: 'Commits open as diff cards',
          description:
            'Each commit row carries summary stats and links directly to the commit diff.',
        },
      },
      {
        type: 'focus_target',
        target: {
          type: 'web_node',
          targetId: 'file-history-commit-first',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'target_clicked',
          targetId: 'file-history-commit-first',
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
        type: 'instruction',
        text: 'Expand README.md to see the changes in that commit.',
        showcase: {
          title: 'The commit diff uses the same review card',
          description:
            'History and working-tree review share the same compact multi-file diff surface.',
        },
      },
      {
        type: 'focus_target',
        target: {
          type: 'web_node',
          targetId: 'diff-card-file-README.md',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'target_clicked',
          targetId: 'diff-card-file-README.md',
        },
      },
      {
        type: 'scroll_to_bottom',
      },
      {
        type: 'instruction',
        text: 'Expand DEMO_SYSTEM.md to compare the second file changed by the commit.',
        showcase: {
          title: 'Commit-level context stays visible',
          description:
            'The card title and subtitle keep the commit subject and time attached to the file patches.',
        },
      },
      {
        type: 'focus_target',
        target: {
          type: 'web_node',
          targetId: 'diff-card-file-docs/DEMO_SYSTEM.md',
        },
      },
      {
        type: 'wait_for_action',
        match: {
          type: 'target_clicked',
          targetId: 'diff-card-file-docs/DEMO_SYSTEM.md',
        },
      },
      {
        type: 'scroll_to_bottom',
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

  story.commandOutput = buildHistoryOutput({
    alias: params.alias,
    result: demoHistory,
  });

  return story;
}

export function fileStories(
  prefix: string,
  alias: string,
): StoryDefinition<unknown>[] {
  return [
    buildEditAndDiffStory({ prefix, alias }),
    buildReviewAndCommitStory({ prefix, alias }),
    buildHistoryCommitDiffStory({ prefix, alias }),
  ];
}

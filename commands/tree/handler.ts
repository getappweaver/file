import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import { buildWorkspaceTree, parseTreeCliArgs } from './workspace-tree';

type HandleTreeCommandProps = {
  restTokens: string[];
  extOption: string | null;
};

type TreeCommandResult =
  { type: 'success'; text: string } | { type: 'error'; text: string };

export function handleTreeCommand(
  props: HandleTreeCommandProps,
): TreeCommandResult {
  const merged = [
    ...props.restTokens,
    ...(props.extOption !== null ? ['--ext', props.extOption] : []),
  ];

  const { maxDepth, targetDirRelative, extFilter } = parseTreeCliArgs(merged);

  try {
    const workspaceRoot = resolveFileWorkspaceRoot();

    const text = buildWorkspaceTree({
      workspaceRoot,
      targetDirRelative,
      maxDepth,
      extFilter,
    });

    return { type: 'success', text };
  } catch (err) {
    return {
      type: 'error',
      text: `File tree failed: ${String(err)}`,
    };
  }
}

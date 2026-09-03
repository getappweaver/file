import type { WebNodeRoot } from '@src/web/ui-schema';

import type { FileCommandAdapterParams } from '../../types/adapter-params';

import { stringOrNull } from '../shared/cli-option-parsing';
import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import {
  acceptBottomupGenerateDraft,
  reviseBottomupGenerateDraft,
} from './handler';
import { renderBottomupGenerateDraft } from './renderers/web';

export async function adaptBottomupGenerateReviseCommand(
  params: FileCommandAdapterParams,
): Promise<string | WebNodeRoot> {
  if (params.source !== 'web') {
    return 'Bottom-up draft revision is only available through the web interface.';
  }

  const state = stringOrNull(params.parsed.options.state);
  const prompt = stringOrNull(params.parsed.options.prompt);

  if (state === null || prompt === null) {
    return 'Draft revision requires --state and --prompt.';
  }

  try {
    const draft = await reviseBottomupGenerateDraft({
      workspaceRoot: resolveFileWorkspaceRoot(),
      state,
      prompt,
    });

    return renderBottomupGenerateDraft({ command: params.alias, draft });
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export async function adaptBottomupGenerateAcceptCommand(
  params: FileCommandAdapterParams,
): Promise<string> {
  if (params.source !== 'web') {
    return 'Bottom-up draft acceptance is only available through the web interface.';
  }

  const state = stringOrNull(params.parsed.options.state);

  if (state === null) {
    return 'Draft acceptance requires --state.';
  }

  try {
    const accepted = acceptBottomupGenerateDraft({
      workspaceRoot: resolveFileWorkspaceRoot(),
      state,
    });

    return `Accepted bottom-up generation draft: ${accepted.filePath}`;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

import type { WebNodeRoot } from '@src/web/ui-schema';

import type { FileCommandAdapterParams } from '../../types/adapter-params';

import {
  boolToOverride,
  csvToArrayOrNull,
  stringOrNull,
} from '../shared/cli-option-parsing';
import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import {
  acceptBottomupEnrichDraft,
  executeBottomupEnrich,
  formatEnrichResult,
  reviseBottomupEnrichDraft,
} from './handler';
import { renderBottomupEnrichDraft } from './renderers/web';

function callFromParams(params: FileCommandAdapterParams) {
  const path = stringOrNull(params.parsed.options.path);

  if (path === null) {
    throw new Error('Missing required option: --path');
  }

  return {
    type: 'bottomup.enrich' as const,
    path,
    root: stringOrNull(params.parsed.options.root),
    respect_gitignore: boolToOverride(params.parsed.options.noGitignore, false),
    include_hidden: boolToOverride(params.parsed.options.includeHidden, true),
    extra_ignore: csvToArrayOrNull(params.parsed.options.ignore),
    model: stringOrNull(params.parsed.options.model),
    prompt: stringOrNull(params.parsed.options.prompt),
    agent_context: null,
    draft: boolToOverride(params.parsed.options.draft, true),
    plan: boolToOverride(params.parsed.options.plan, true),
    allow_partial: boolToOverride(params.parsed.options.allowPartial, true),
    force: boolToOverride(params.parsed.options.force, true),
    context: stringOrNull(params.parsed.options.context),
  };
}

export async function adaptBottomupEnrichCommand(
  params: FileCommandAdapterParams,
): Promise<string | WebNodeRoot> {
  try {
    const result = await executeBottomupEnrich({
      workspaceRoot: resolveFileWorkspaceRoot(),
      draftAllowed: params.source === 'web',
      call: callFromParams(params),
    });

    return result.type === 'draft'
      ? renderBottomupEnrichDraft({ command: params.alias, draft: result })
      : formatEnrichResult(result);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export async function adaptBottomupEnrichReviseCommand(
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
    const draft = await reviseBottomupEnrichDraft({
      workspaceRoot: resolveFileWorkspaceRoot(),
      state,
      prompt,
    });

    return renderBottomupEnrichDraft({ command: params.alias, draft });
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export async function adaptBottomupEnrichAcceptCommand(
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
    const accepted = acceptBottomupEnrichDraft({
      workspaceRoot: resolveFileWorkspaceRoot(),
      state,
    });

    return `Accepted bottom-up enrichment draft: ${accepted.files.length} file(s).`;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

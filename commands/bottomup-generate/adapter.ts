import type { FileCommandAdapterParams } from '../../types/adapter-params';

import {
  boolToOverride,
  csvToArrayOrNull,
  stringOrNull,
} from '../shared/cli-option-parsing';
import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import { executeBottomupGenerate, formatGenerateResult } from './handler';
import { renderBottomupGenerateDraft } from './renderers/web';

export async function adaptBottomupGenerateCommand(
  params: FileCommandAdapterParams,
): Promise<string | ReturnType<typeof renderBottomupGenerateDraft>> {
  const path = stringOrNull(params.parsed.options.path);

  if (path === null) {
    return 'Missing required option: --path';
  }

  try {
    const result = await executeBottomupGenerate({
      workspaceRoot: resolveFileWorkspaceRoot(),
      draftAllowed: params.source === 'web',
      call: {
        type: 'bottomup.generate',
        path,
        root: stringOrNull(params.parsed.options.root),
        respect_gitignore: boolToOverride(
          params.parsed.options.noGitignore,
          false,
        ),
        include_hidden: boolToOverride(
          params.parsed.options.includeHidden,
          true,
        ),
        extra_ignore: csvToArrayOrNull(params.parsed.options.ignore),
        model: stringOrNull(params.parsed.options.model),
        prompt: stringOrNull(params.parsed.options.prompt),
        agent_context: null,
        draft: boolToOverride(params.parsed.options.draft, true),
        plan: boolToOverride(params.parsed.options.plan, true),
        recursive: boolToOverride(params.parsed.options.recursive, true),
        enrich: boolToOverride(params.parsed.options.enrich, true),
        context: stringOrNull(params.parsed.options.context),
      },
    });

    return result.type === 'draft'
      ? renderBottomupGenerateDraft({ command: params.alias, draft: result })
      : formatGenerateResult(result);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

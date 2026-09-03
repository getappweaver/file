import { z } from 'zod';

import type { WebNodeRoot } from '@src/web/ui-schema';

import type { FileCommandAdapterParams } from '../../types/adapter-params';

import {
  boolToOverride,
  intOrNull,
  stringOrNull,
} from '../shared/cli-option-parsing';
import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import {
  defaultSummaryLocation,
  executeBottomupSummary,
  formatBottomupSummary,
  readBottomupSummary,
  saveBottomupSummary,
} from './handler';
import { renderBottomupSummaryPreview } from './renderers/web';

const SummaryPreviewStateSchema = z.object({
  version: z.literal(1),
  content: z.string(),
});

function encodeState(content: string): string {
  return Buffer.from(JSON.stringify({ version: 1, content }), 'utf8').toString(
    'base64url',
  );
}

function decodeState(value: string): string {
  try {
    return SummaryPreviewStateSchema.parse(
      JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown,
    ).content;
  } catch {
    throw new Error('Invalid or expired bottom-up summary preview state.');
  }
}

function callFromParams(params: FileCommandAdapterParams) {
  const path = stringOrNull(params.parsed.options.path);

  if (path === null) {
    throw new Error('Missing required option: --path');
  }

  const formatValue = stringOrNull(params.parsed.options.format);

  const format =
    formatValue === 'json' ? ('json' as const) : ('markdown' as const);

  return {
    type: 'bottomup.summary' as const,
    path,
    root: stringOrNull(params.parsed.options.root),
    format,
    parent_depth: intOrNull(params.parsed.options.parentDepth),
    child_depth: intOrNull(params.parsed.options.childDepth),
    location: stringOrNull(params.parsed.options.location),
    draft: boolToOverride(params.parsed.options.draft, true),
  };
}

export function adaptBottomupSummaryCommand(
  params: FileCommandAdapterParams,
): string | WebNodeRoot {
  try {
    const call = callFromParams(params);

    if (call.draft && params.source !== 'web') {
      throw new Error('--draft is only available through the web interface.');
    }

    if (call.draft && call.location !== null) {
      throw new Error('--draft and --location cannot be combined.');
    }

    const workspaceRoot = resolveFileWorkspaceRoot();

    if (!call.draft) {
      return executeBottomupSummary({ workspaceRoot, call });
    }

    const projection = readBottomupSummary({ workspaceRoot, call });
    const content = formatBottomupSummary(projection, call.format);

    return renderBottomupSummaryPreview({
      command: params.alias,
      content,
      defaultLocation: defaultSummaryLocation({
        projection,
        format: call.format,
      }),
      state: encodeState(content),
      format: call.format,
    });
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export function adaptBottomupSummarySaveCommand(
  params: FileCommandAdapterParams,
): string {
  if (params.source !== 'web') {
    return 'Bottom-up summary preview saving is only available through the web interface.';
  }

  const state = stringOrNull(params.parsed.options.state);
  const location = stringOrNull(params.parsed.options.location);

  if (state === null || location === null) {
    return 'Summary preview saving requires --state and --location.';
  }

  try {
    const saved = saveBottomupSummary({
      workspaceRoot: resolveFileWorkspaceRoot(),
      location,
      content: decodeState(state),
    });

    return `Saved bottom-up summary projection: ${saved}`;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

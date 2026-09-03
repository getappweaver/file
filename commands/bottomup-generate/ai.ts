import { getOutputString } from '@src/backends/types';
import { createPluginAgentService } from '@src/core/plugin-agent';
import { openCoreDb } from '@src/db';
import { dmBotRoot, getParentWorkspaceRoot } from '@src/paths';

import {
  GenerateAiResponseSchema,
  type GenerateAiResponse,
  type GeneratePrompt,
} from './types';

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');

  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error('Generate agent did not return a JSON object.');
  }

  return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as unknown;
}

export const defaultGeneratePrompt: GeneratePrompt = async ({
  cwd,
  prompt,
  model,
  sessionId,
}) => {
  const db = openCoreDb();

  try {
    const agent = createPluginAgentService({
      db,
      dmBotRoot,
      parentOfBotRoot: getParentWorkspaceRoot(),
      attachUrl: null,
    });

    const result = await agent.run({
      prompt,
      sessionId,
      backend: null,
      provider: null,
      model,
      mode: null,
      workspaceTarget: null,
      cwd,
      onAgentStreamChunk: null,
      abortSignal: null,
      context: null,
    });

    return {
      output: getOutputString(result).trim(),
      sessionId: result.sessionId,
    };
  } finally {
    db.close();
  }
};

export async function runGenerateAgent(params: {
  runPrompt: GeneratePrompt;
  cwd: string;
  model: string | null;
  sessionId: string | null;
  directoryPath: string;
  prompt: string | null;
  context: string | null;
  enrich: boolean;
  files: Array<{
    name: string;
    path: string;
    hash: string;
    existingSummary: string | null;
    suppliedSourceSummary: string | null;
    suppliedEnrichedSummary: string | null;
    sourceState: 'changed' | 'binary' | 'unchanged' | 'supplied';
    size: number | null;
    truncated: boolean;
    text: string | null;
  }>;
  suppliedDirectorySummary: string | null;
  suppliedDirectoryEnrichedSummary: string | null;
}): Promise<{ response: GenerateAiResponse; sessionId: string }> {
  const shape = {
    directory_summary: 'string',
    files: [
      {
        name: 'string',
        source_summary: 'string',
        enriched_summary: params.enrich ? 'string or null' : null,
      },
    ],
    normalized_context: params.enrich ? 'string or null' : null,
    directory_enriched_summary: params.enrich ? 'string or null' : null,
  };

  const prompt = [
    'Create compact source-grounded knowledge for one directory.',
    'Return JSON only with this exact shape:',
    JSON.stringify(shape),
    'Rules:',
    '- directory_summary describes stable responsibilities established by the direct files',
    '- return exactly one files entry for every listed file',
    '- source_summary is one terse source-grounded sentence',
    '- trust supplied summaries when they agree with the supplied source',
    '- source is intentionally omitted for hash-unchanged files; preserve their existing source summary',
    '- source is intentionally omitted when a trusted supplied source summary is present',
    '- if an omitted source is genuinely required to resolve an ambiguity, you may read only that exact path with your file tools',
    '- do not read omitted source by default',
    '- do not describe child directories or invent repository-wide behavior',
    params.enrich
      ? '- enriched summaries add only architectural role from the supplied context'
      : '- enriched_summary, normalized_context, and directory_enriched_summary must be null',
    params.enrich
      ? '- normalized_context compactly normalizes the supplied big-picture context'
      : '',
    params.enrich
      ? '- directory_enriched_summary must explain the directory role in that context'
      : '',
    '',
    `Directory: ${params.directoryPath}`,
    params.prompt ? `User instructions:\n${params.prompt}` : '',
    params.context ? `Big-picture context:\n${params.context}` : '',
    params.suppliedDirectorySummary
      ? `Supplied directory source summary:\n${params.suppliedDirectorySummary}`
      : '',
    params.suppliedDirectoryEnrichedSummary
      ? `Supplied directory enriched summary:\n${params.suppliedDirectoryEnrichedSummary}`
      : '',
    '',
    'Direct files:',
    params.files.length === 0
      ? '- none'
      : params.files
          .map((file) =>
            [
              `- name: ${file.name}`,
              `  path: ${file.path}`,
              `  hash: ${file.hash}`,
              `  source_state: ${file.sourceState}`,
              file.size === null ? '' : `  size: ${file.size}`,
              file.truncated ? '  note: source truncated' : '',
              file.existingSummary
                ? `  existing_source_summary: ${file.existingSummary}`
                : '',
              file.suppliedSourceSummary
                ? `  supplied_source_summary: ${file.suppliedSourceSummary}`
                : '',
              file.suppliedEnrichedSummary
                ? `  supplied_enriched_summary: ${file.suppliedEnrichedSummary}`
                : '',
              file.text !== null
                ? `  source:\n${file.text}`
                : file.sourceState === 'binary'
                  ? '  source: unavailable (binary)'
                  : file.sourceState === 'unchanged'
                    ? '  source: omitted (hash unchanged; use existing_source_summary)'
                    : '  source: omitted (trusted supplied_source_summary)',
            ]
              .filter(Boolean)
              .join('\n'),
          )
          .join('\n\n'),
  ]
    .filter((line) => line.length > 0)
    .join('\n');

  const result = await params.runPrompt({
    cwd: params.cwd,
    prompt,
    model: params.model,
    sessionId: params.sessionId,
  });

  return {
    response: GenerateAiResponseSchema.parse(extractJson(result.output)),
    sessionId: result.sessionId,
  };
}

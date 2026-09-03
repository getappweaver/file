import { defaultGeneratePrompt } from '../bottomup-generate/ai';
import type { GeneratePrompt } from '../bottomup-generate/types';

import { EnrichAiResponseSchema, type EnrichAiResponse } from './types';

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');

  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error('Enrichment agent did not return a JSON object.');
  }

  return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as unknown;
}

export async function runEnrichAgent(params: {
  runPrompt?: GeneratePrompt;
  cwd: string;
  model: string | null;
  sessionId: string | null;
  directoryPath: string;
  prompt: string | null;
  context: string;
  directorySourceSummary: string;
  directoryCompactSummary: string;
  files: Array<{
    name: string;
    path: string;
    sourceSummary: string;
    suppliedEnrichedSummary: string | null;
  }>;
  children: Array<{
    name: string;
    path: string;
    summary: string;
  }>;
  suppliedDirectoryEnrichedSummary: string | null;
}): Promise<{ response: EnrichAiResponse; sessionId: string }> {
  const prompt = [
    'Enrich stored source-grounded knowledge for one directory.',
    'Return JSON only with this exact shape:',
    JSON.stringify({
      directory_enriched_summary: 'string',
      files: [{ name: 'string', enriched_summary: 'string or null' }],
    }),
    'Rules:',
    '- use the stored source summaries as authoritative source knowledge',
    '- do not reread source files by default',
    '- if a stored summary is genuinely insufficient to resolve an ambiguity, you may read only that exact path with file tools',
    '- directory_enriched_summary adds architectural role without repeating the source summary',
    '- return exactly one files entry for every direct file',
    '- enriched_summary adds only contextual role and may be null when no addition is useful',
    '- do not alter or regenerate source summaries',
    '- do not invent files, children, or relationships',
    '',
    `Directory: ${params.directoryPath}`,
    params.prompt ? `User instructions:\n${params.prompt}` : '',
    `Effective context:\n${params.context}`,
    `Directory source summary:\n${params.directorySourceSummary}`,
    `Directory compact summary:\n${params.directoryCompactSummary}`,
    params.suppliedDirectoryEnrichedSummary
      ? `Supplied directory enrichment:\n${params.suppliedDirectoryEnrichedSummary}`
      : '',
    '',
    'Direct files (source omitted intentionally):',
    params.files.length === 0
      ? '- none'
      : params.files
          .map((file) =>
            [
              `- name: ${file.name}`,
              `  path: ${file.path}`,
              `  source_summary: ${file.sourceSummary}`,
              file.suppliedEnrichedSummary
                ? `  supplied_enriched_summary: ${file.suppliedEnrichedSummary}`
                : '',
            ]
              .filter(Boolean)
              .join('\n'),
          )
          .join('\n'),
    '',
    'Direct child directories:',
    params.children.length === 0
      ? '- none'
      : params.children
          .map(
            (child) =>
              `- name: ${child.name}\n  path: ${child.path}\n  compact_summary: ${child.summary}`,
          )
          .join('\n'),
  ]
    .filter((line) => line.length > 0)
    .join('\n');

  const result = await (params.runPrompt ?? defaultGeneratePrompt)({
    cwd: params.cwd,
    prompt,
    model: params.model,
    sessionId: params.sessionId,
  });

  return {
    response: EnrichAiResponseSchema.parse(extractJson(result.output)),
    sessionId: result.sessionId,
  };
}

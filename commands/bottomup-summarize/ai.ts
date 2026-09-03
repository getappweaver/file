import { defaultGeneratePrompt } from '../bottomup-generate/ai';
import type { GeneratePrompt } from '../bottomup-generate/types';

import { SummarizeAiResponseSchema } from './types';

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');

  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error('Summarize agent did not return a JSON object.');
  }

  return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as unknown;
}

export async function runSummarizeAgent(params: {
  runPrompt?: GeneratePrompt;
  cwd: string;
  model: string | null;
  sessionId: string | null;
  directoryPath: string;
  prompt: string | null;
  directorySourceSummary: string;
  children: Array<{ path: string; summary: string; complete: boolean }>;
  incompleteCoverage: { missing: string[]; stale: string[] };
  suppliedSummary: string | null;
}) {
  const prompt = [
    'Create a compact hierarchical summary for one directory.',
    'Return JSON only with this exact shape:',
    JSON.stringify({ summary: 'string' }),
    'Rules:',
    '- derive the result only from the accepted source-grounded directory summary and immediate child summaries below',
    '- do not read source files and do not use contextual enrichment',
    '- describe system purpose, major responsibilities, relationships, entry points, flows, and constraints only when supported by the inputs',
    '- remain concise; details stay in lower directory records',
    '- account for incomplete coverage and do not imply omitted areas were analyzed',
    '- do not invent files, directories, or relationships',
    '',
    `Directory: ${params.directoryPath}`,
    params.prompt ? `User instructions:\n${params.prompt}` : '',
    `Direct source summary:\n${params.directorySourceSummary}`,
    params.suppliedSummary
      ? `Agent-supplied learned directory knowledge:\n${params.suppliedSummary}`
      : '',
    '',
    'Immediate child summaries:',
    params.children.length === 0
      ? '- none'
      : params.children
          .map(
            (child) =>
              `- path: ${child.path}\n  complete: ${child.complete}\n  summary: ${child.summary}`,
          )
          .join('\n'),
    '',
    `Missing generated coverage: ${params.incompleteCoverage.missing.join(', ') || 'none'}`,
    `Stale generated coverage: ${params.incompleteCoverage.stale.join(', ') || 'none'}`,
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
    response: SummarizeAiResponseSchema.parse(extractJson(result.output)),
    sessionId: result.sessionId,
  };
}

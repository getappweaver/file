import { createBackend } from '@src/backends/factory';
import { disposeOpencodeSdk } from '@src/backends/opencode-sdk';
import { getOutputString } from '@src/backends/types';
import {
  getAgentBackend,
  getBackendExecutionProfile,
  getCurrentOrDefaultMode,
  getModelOverride,
  getProviderName,
  getRoutstrSkKey,
  openCoreDb,
} from '@src/db';
import { log } from '@src/logger';
import { dmBotRoot } from '@src/paths';

import { normalizeOneLine, serializeNodeForSummary } from './doc';
import type { DirectoryNode, FileSnippet } from './types';
import { AI_DIRECTORY_SUMMARY_SCHEMA } from './types';

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error('Model did not return JSON.');
}

type ParsedDirectorySummary = {
  directory_summary?: unknown;
  notes?: unknown;
  files?: unknown;
  subdirectories?: unknown;
};

function parseDirectorySummaryJson(raw: string): ParsedDirectorySummary {
  return JSON.parse(extractJsonObject(raw)) as ParsedDirectorySummary;
}

async function repairDirectorySummaryJson(params: {
  agentCwd: string;
  model: string | null;
  raw: string;
}): Promise<ParsedDirectorySummary> {
  const prompt = [
    'Repair the malformed JSON below.',
    'Return JSON only.',
    'Use this exact shape:',
    JSON.stringify(AI_DIRECTORY_SUMMARY_SCHEMA),
    'Rules:',
    '- Preserve the original meaning when possible',
    '- Ensure files and subdirectories are arrays of objects with name and summary strings',
    '- Do not add commentary, markdown, or code fences',
    '',
    'Malformed JSON:',
    params.raw,
  ].join('\n');

  const repaired = await runAiPrompt(params.agentCwd, prompt, params.model);

  return parseDirectorySummaryJson(repaired);
}

export async function runAiPrompt(
  cwd: string,
  prompt: string,
  model: string | null,
): Promise<string> {
  log.info(
    `bottomup: starting AI summary in ${cwd} (${prompt.length} prompt chars)`,
  );

  const coreDb = openCoreDb();
  try {
    const backendName = getAgentBackend(coreDb);
    const executionProfile = getBackendExecutionProfile(coreDb, backendName);
    const configuredModel = getModelOverride(coreDb, backendName);
    const effectiveModel = model ?? configuredModel;

    const backend = createBackend({
      backendName,
      dmBotRoot,
      cursorMode: getCurrentOrDefaultMode(coreDb),
      opencodeAgentName:
        executionProfile.kind === 'opencode' ? executionProfile.agent : null,
      attachUrl: null,
      modelOverride: effectiveModel,
      providerName: getProviderName(coreDb),
    });

    const sessionId = await backend.createSession(cwd);

    const result = await backend.runMessage({
      sessionId,
      content: prompt,
      cursorMode: getCurrentOrDefaultMode(coreDb),
      opencodeAgentName:
        executionProfile.kind === 'opencode' ? executionProfile.agent : null,
      cwd,
      getRoutstrSkKey: () => getRoutstrSkKey(coreDb),
      modelOverride: effectiveModel,
      onAgentStreamChunk: null,
      streamAbortSignal: null,
    });

    const output = getOutputString(result).trim();
    log.info(`bottomup: AI summary finished (${output.length} output chars)`);

    if (output.length === 0 || output === '(no output)') {
      throw new Error('Model returned empty output.');
    }

    return output;
  } finally {
    disposeOpencodeSdk();
    coreDb.close();
  }
}

export async function summarizeDirectoryWithAi(params: {
  agentCwd: string;
  directoryName: string;
  directoryRelativePosix: string;
  files: FileSnippet[];
  children: DirectoryNode[];
  includeFileSummaries: boolean;
  model: string | null;
}): Promise<{
  directorySummary: string;
  notes: string[];
  fileSummaries: Map<string, string>;
  childSummaries: Map<string, string>;
}> {
  log.info(
    `bottomup: summarize directory ${params.directoryRelativePosix} (${params.files.length} files, ${params.children.length} child dirs)`,
  );

  const prompt = [
    'You are writing compact local documentation for AI agents.',
    'Summarize only the current directory. Do not describe the entire repository unless the input proves it.',
    'Purpose: these summaries help future agents understand a subtree quickly without repeatedly rereading every file.',
    'Optimize for stable responsibilities, entrypoints, public surface area, and local conventions rather than implementation trivia.',
    'Return JSON only with this exact shape:',
    JSON.stringify(AI_DIRECTORY_SUMMARY_SCHEMA),
    'Rules:',
    '- directory_summary: 1-3 short sentences, concrete and local',
    '- notes: at most 3 short strings; omit generic advice',
    '- files: one entry per input file when file summaries are requested',
    '- each file summary must be a terse phrase or single sentence, not a list of extracted symbols',
    '- prefer the file role, how it participates in the local flow, and who uses it or what it exposes when that is clear',
    '- mention exported entrypoints only when they are central to understanding the file',
    '- avoid helper-by-helper narration, import lists, boilerplate phrasing, or labels like "primary public surface"',
    '- subdirectories: one entry per input child directory, local and concise',
    '- do not mention paths that are not in the input',
    '- do not include markdown, code fences, or explanatory text outside the JSON',
    '',
    `Directory: ${params.directoryRelativePosix}`,
    `Folder name: ${params.directoryName}`,
    `Include file summaries: ${params.includeFileSummaries ? 'yes' : 'no'}`,
    '',
    'Direct files:',
    params.files.length === 0
      ? '- none'
      : params.files
          .map((file) => {
            const lines = [
              `- name: ${file.name}`,
              `  path: ${file.relativePosix}`,
              `  size_bytes: ${file.sizeBytes}`,
            ];

            if (file.skippedReason) {
              lines.push(`  note: ${file.skippedReason}`);
            }

            if (file.snippet) {
              lines.push(`  snippet:\n${file.snippet}`);
            }

            return lines.join('\n');
          })
          .join('\n\n'),
    '',
    'Direct subdirectories:',
    params.children.length === 0
      ? '- none'
      : params.children
          .map(
            (child) =>
              `- name: ${child.name}\n  path: ${child.relativePosix}\n  child_summary: ${child.directorySummary}`,
          )
          .join('\n\n'),
  ].join('\n');

  try {
    const raw = await runAiPrompt(params.agentCwd, prompt, params.model);

    let parsed: ParsedDirectorySummary;

    try {
      parsed = parseDirectorySummaryJson(raw);
    } catch (error) {
      log.warn(
        `bottomup: repairing malformed AI JSON for ${params.directoryRelativePosix}: ${error instanceof Error ? error.message : String(error)}`,
      );

      parsed = await repairDirectorySummaryJson({
        agentCwd: params.agentCwd,
        model: params.model,
        raw,
      });
    }

    const directorySummary =
      typeof parsed.directory_summary === 'string'
        ? normalizeOneLine(parsed.directory_summary)
        : '';

    const notes = Array.isArray(parsed.notes)
      ? parsed.notes
          .filter((value): value is string => typeof value === 'string')
          .map(normalizeOneLine)
          .filter((value) => value.length > 0)
          .slice(0, 3)
      : [];

    const fileSummaries = new Map<string, string>();
    const childSummaries = new Map<string, string>();

    if (Array.isArray(parsed.files)) {
      for (const value of parsed.files) {
        if (
          value &&
          typeof value === 'object' &&
          typeof (value as { name?: unknown }).name === 'string' &&
          typeof (value as { summary?: unknown }).summary === 'string'
        ) {
          fileSummaries.set(
            (value as { name: string }).name,
            normalizeOneLine((value as { summary: string }).summary),
          );
        }
      }
    }

    if (Array.isArray(parsed.subdirectories)) {
      for (const value of parsed.subdirectories) {
        if (
          value &&
          typeof value === 'object' &&
          typeof (value as { name?: unknown }).name === 'string' &&
          typeof (value as { summary?: unknown }).summary === 'string'
        ) {
          childSummaries.set(
            (value as { name: string }).name,
            normalizeOneLine((value as { summary: string }).summary),
          );
        }
      }
    }

    if (directorySummary.length === 0) {
      throw new Error(
        `Missing directory summary for ${params.directoryRelativePosix}.`,
      );
    }

    if (params.includeFileSummaries) {
      for (const file of params.files) {
        const summary = fileSummaries.get(file.name);

        if (!summary || summary.length === 0) {
          throw new Error(
            `Missing file summary for ${params.directoryRelativePosix}/${file.name}.`,
          );
        }
      }
    }

    for (const child of params.children) {
      const summary = childSummaries.get(child.name);

      if (!summary || summary.length === 0) {
        throw new Error(
          `Missing subdirectory summary for ${params.directoryRelativePosix}/${child.name}.`,
        );
      }
    }

    return { directorySummary, notes, fileSummaries, childSummaries };
  } catch (error) {
    throw new Error(
      `AI summary failed for ${params.directoryRelativePosix}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function refineDirectoryWithAi(params: {
  agentCwd: string;
  directoryRelativePosix: string;
  bigPicture: string;
  existingBody: string;
  model: string | null;
}): Promise<string | null> {
  log.info(`bottomup: pass2 refine ${params.directoryRelativePosix}`);

  const prompt = [
    'You are enriching local AI-agent documentation with big-picture context.',
    'This is a second pass. The documents were already generated bottom-up from source code.',
    "Now you have the full picture of the entire subtree. Use it to improve this directory's doc.",
    '',
    'Rules:',
    '- Preserve the exact markdown structure: ## Purpose, ## Files, ## Notes, ## Subdirectories',
    '- Only update content that genuinely benefits from the big-picture context (e.g. clarifying how this directory fits into the whole, fixing misleading phrasing, adding missing cross-cutting context)',
    '- Do not add sections that do not already exist in the current doc',
    '- Do not invent files or subdirectories not present in the current doc',
    '- If the current doc is already accurate and complete given the big picture, respond with exactly: NO_CHANGE',
    '- Otherwise respond with the full updated markdown body only (no frontmatter, no code fences)',
    '',
    '## Big picture (entire subtree summary)',
    params.bigPicture,
    '',
    `## Current doc for: ${params.directoryRelativePosix}`,
    params.existingBody.trim(),
  ].join('\n');

  try {
    const raw = await runAiPrompt(params.agentCwd, prompt, params.model);
    const trimmed = raw.trim();

    if (
      trimmed === 'NO_CHANGE' ||
      trimmed.toUpperCase().includes('NO_CHANGE')
    ) {
      return null;
    }

    return trimmed;
  } catch (error) {
    throw new Error(
      `AI pass2 refine failed for ${params.directoryRelativePosix}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function summarizeTreeForUser(
  root: DirectoryNode,
  workspaceRoot: string,
  model: string | null,
): Promise<string> {
  const targetDirectory = root.relativePosix === '.' ? '.' : root.relativePosix;

  const prompt = [
    'You are summarizing a codebase subtree for an AI agent or user.',
    'Return markdown only.',
    'Keep it concise, role-oriented, and useful for future task execution.',
    'Use these sections when helpful: Overview, Important directories, Important files, Notes.',
    'Do not invent directories or files.',
    '',
    `Target directory: ${targetDirectory}`,
    '',
    serializeNodeForSummary(root),
  ].join('\n');

  return (await runAiPrompt(workspaceRoot, prompt, model)).trim();
}

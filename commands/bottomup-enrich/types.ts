import { z } from 'zod';

import type { BottomupIndexSchema } from '../bottomup-generate/types';

export const EnrichAiResponseSchema = z.object({
  directory_enriched_summary: z.string().min(1),
  files: z.array(
    z.object({
      name: z.string().min(1),
      enriched_summary: z.string().min(1).nullable(),
    }),
  ),
});

export type EnrichAiResponse = z.infer<typeof EnrichAiResponseSchema>;

export type EnrichResolvedOptions = {
  path: string;
  root: string | null;
  respectGitignore: boolean;
  includeHidden: boolean;
  extraIgnore: string[];
  model: string | null;
  prompt: string | null;
  context: string | null;
  allowPartial: boolean;
  force: boolean;
  draft: boolean;
  plan: boolean;
  agentContext: {
    context: string | null;
    files: Record<string, { enrichedSummary?: string }>;
    directories: Record<string, { enrichedSummary?: string }>;
  } | null;
};

export type EnrichCandidate = {
  absolutePath: string;
  path: string;
  status: 'current' | 'missing' | 'stale' | 'blocked';
  index: z.infer<typeof BottomupIndexSchema> | null;
  currentSourceInputHash: string | null;
  parentPath: string | null;
};

export type EnrichPlan = {
  path: string;
  root: string;
  rootSource: 'explicit' | 'nearest marked ancestor' | 'workspace fallback';
  complete: boolean;
  currentDirectories: number;
  missing: string[];
  stale: string[];
  blocked: string[];
  missingSummaries: string[];
  staleSummaries: string[];
  expectedAiCalls: number;
  affectedFiles: string[];
  warnings: string[];
};

export type EnrichDraftState = {
  version: 1;
  call: unknown;
  baseHashes: Record<string, string | null>;
  proposedFiles: Record<string, string>;
  agentSessionIds: Record<string, string>;
};

export const EnrichDraftStateSchema = z.object({
  version: z.literal(1),
  call: z.unknown(),
  baseHashes: z.record(z.string(), z.string().min(1).nullable()),
  proposedFiles: z.record(z.string(), z.string().min(1)),
  agentSessionIds: z.record(z.string(), z.string().min(1)),
});

export type EnrichResult =
  | { type: 'plan'; plan: EnrichPlan }
  | {
      type: 'written';
      root: string;
      updated: string[];
      skipped: string[];
      missing: string[];
      stale: string[];
      blocked: string[];
      missingSummaries: string[];
      staleSummaries: string[];
      aiCalls: number;
    }
  | {
      type: 'draft';
      root: string;
      updated: string[];
      skipped: string[];
      missing: string[];
      stale: string[];
      blocked: string[];
      missingSummaries: string[];
      staleSummaries: string[];
      aiCalls: number;
      diff: string;
      state: string;
    };

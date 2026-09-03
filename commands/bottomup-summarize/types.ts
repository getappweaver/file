import { z } from 'zod';

import type { BottomupIndex } from '../bottomup-generate/types';

export const SummarizeAiResponseSchema = z.object({
  summary: z.string().min(1),
});

export type SummarizeResolvedOptions = {
  path: string;
  root: string | null;
  respectGitignore: boolean;
  includeHidden: boolean;
  extraIgnore: string[];
  model: string | null;
  prompt: string | null;
  noPartial: boolean;
  draft: boolean;
  plan: boolean;
  agentContext: {
    directories: Record<string, { sourceSummary?: string }>;
  } | null;
};

export type SummarizeCandidate = {
  absolutePath: string;
  path: string;
  status: 'current' | 'missing' | 'stale';
  index: BottomupIndex | null;
  parentPath: string | null;
};

export type SummarizePlan = {
  path: string;
  root: string;
  rootSource: 'explicit' | 'nearest marked ancestor' | 'workspace fallback';
  complete: boolean;
  currentDirectories: number;
  missing: string[];
  stale: string[];
  expectedAiCalls: number;
  affectedFiles: string[];
  warnings: string[];
};

export type SummarizeDraftState = {
  version: 1;
  call: unknown;
  scope: Array<{ path: string; generated: boolean }>;
  baseHashes: Record<string, string | null>;
  sourceInputHashes: Record<string, string>;
  proposedFiles: Record<string, string>;
  agentSessionIds: Record<string, string>;
};

export const SummarizeDraftStateSchema = z.object({
  version: z.literal(1),
  call: z.unknown(),
  scope: z.array(
    z.object({
      path: z.string().min(1),
      generated: z.boolean(),
    }),
  ),
  baseHashes: z.record(z.string(), z.string().min(1).nullable()),
  sourceInputHashes: z.record(z.string(), z.string().min(1)),
  proposedFiles: z.record(z.string(), z.string().min(1)),
  agentSessionIds: z.record(z.string(), z.string().min(1)),
});

export type SummarizeResult =
  | { type: 'plan'; plan: SummarizePlan }
  | {
      type: 'written';
      root: string;
      updated: string[];
      skipped: string[];
      missing: string[];
      stale: string[];
      aiCalls: number;
    }
  | {
      type: 'draft';
      root: string;
      updated: string[];
      skipped: string[];
      missing: string[];
      stale: string[];
      aiCalls: number;
      diff: string;
      state: string;
    };

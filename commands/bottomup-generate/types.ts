import { z } from 'zod';

export const BOTTOMUP_INDEX_FILE = '.BOTTOMUP.json';
export const BOTTOMUP_INDEX_SCHEMA_VERSION = 1;
export const BOTTOMUP_SOURCE_VERSION = 1;
export const BOTTOMUP_SUMMARY_VERSION = 1;
export const BOTTOMUP_ENRICHMENT_VERSION = 3;

const FileRecordSchema = z.object({
  hash: z.string().min(1),
  sourceSummary: z.string(),
  provenance: z.enum(['ai', 'agent']),
});

const ChildRecordSchema = z.object({
  path: z.string().min(1),
  status: z.enum(['current', 'missing', 'stale']),
  sourceInputHash: z.string().min(1).nullable(),
});

const ContextRecordSchema = z.object({
  value: z.string(),
  origin: z.enum(['ai', 'agent', 'user']),
  hash: z.string().min(1),
});

const EnrichmentRecordSchema = z.object({
  inputHash: z.string().min(1),
  summaryHash: z.string().min(1).nullable().default(null),
  directorySummary: z.string(),
  files: z.record(z.string(), z.string()),
  provenance: z.enum(['ai', 'agent']),
});

const SummaryRecordSchema = z.object({
  version: z.literal(BOTTOMUP_SUMMARY_VERSION),
  inputHash: z.string().min(1),
  value: z.string().min(1),
  provenance: z.enum(['ai', 'agent', 'derived']),
});

export const BottomupIndexSchema = z.object({
  schemaVersion: z.literal(BOTTOMUP_INDEX_SCHEMA_VERSION),
  path: z.string().min(1),
  scope: z.object({ root: z.boolean() }),
  source: z.object({
    version: z.literal(BOTTOMUP_SOURCE_VERSION),
    inputHash: z.string().min(1),
    directorySummary: z.string(),
    files: z.record(z.string(), FileRecordSchema),
  }),
  children: z.record(z.string(), ChildRecordSchema),
  coverage: z.object({
    complete: z.boolean(),
    missing: z.array(z.string()),
    stale: z.array(z.string()),
  }),
  summary: SummaryRecordSchema.nullable().default(null),
  context: ContextRecordSchema.nullable(),
  enrichment: EnrichmentRecordSchema.nullable(),
});

export type BottomupIndex = z.infer<typeof BottomupIndexSchema>;

export const GenerateAiResponseSchema = z.object({
  directory_summary: z.string().min(1),
  files: z.array(
    z.object({
      name: z.string().min(1),
      source_summary: z.string().min(1),
      enriched_summary: z.string().min(1).nullable(),
    }),
  ),
  normalized_context: z.string().min(1).nullable(),
  directory_enriched_summary: z.string().min(1).nullable(),
});

export type GenerateAiResponse = z.infer<typeof GenerateAiResponseSchema>;

export type GenerateResolvedOptions = {
  path: string;
  root: string | null;
  respectGitignore: boolean;
  includeHidden: boolean;
  extraIgnore: string[];
  model: string | null;
  prompt: string | null;
  recursive: boolean;
  enrich: boolean;
  context: string | null;
  draft: boolean;
  plan: boolean;
  agentContext: {
    context: string | null;
    files: Record<string, { sourceSummary?: string; enrichedSummary?: string }>;
    directories: Record<
      string,
      { sourceSummary?: string; enrichedSummary?: string }
    >;
  } | null;
};

export type GeneratePrompt = (params: {
  cwd: string;
  prompt: string;
  model: string | null;
  sessionId: string | null;
}) => Promise<{ output: string; sessionId: string }>;

export type GeneratePlan = {
  path: string;
  root: string;
  rootSource: 'explicit' | 'nearest marked ancestor' | 'workspace fallback';
  recursive: boolean;
  directories: number;
  directFiles: number;
  currentFiles: number;
  staleFiles: number;
  missingFiles: number;
  expectedAiCalls: number;
  affectedFiles: string[];
  warnings: string[];
};

export type GenerateResult =
  | { type: 'plan'; plan: GeneratePlan }
  | {
      type: 'written';
      root: string;
      generated: string[];
      skipped: string[];
      aiCalls: number;
    }
  | {
      type: 'draft';
      root: string;
      path: string;
      filePath: string;
      baseHash: string | null;
      proposed: string;
      diff: string;
      aiCalls: number;
      state: string;
    };

export const BottomupGenerateDraftStateSchema = z.object({
  version: z.literal(1),
  call: z.unknown(),
  path: z.string().min(1),
  root: z.string().min(1),
  filePath: z.string().min(1),
  baseHash: z.string().min(1).nullable(),
  proposed: z.string().min(1),
  agentSessionId: z.string().min(1).nullable(),
});

export type BottomupGenerateDraftState = z.infer<
  typeof BottomupGenerateDraftStateSchema
>;

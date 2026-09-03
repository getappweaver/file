import { z } from 'zod';

const NullableString = z.union([z.string().min(1), z.null()]);
const NullableInteger = z.union([z.int().nonnegative(), z.null()]);
const NullableBoolean = z.union([z.boolean(), z.null()]);
const NullableStringArray = z.union([z.array(z.string().min(1)), z.null()]);

const BottomupAgentKnowledgeSchema = z.object({
  source_summary: NullableString.optional(),
  enriched_summary: NullableString.optional(),
});

export const BottomupGenerateCallSchema = z.object({
  type: z.literal('bottomup.generate'),
  path: z.string().min(1),
  root: NullableString,
  respect_gitignore: NullableBoolean,
  include_hidden: NullableBoolean,
  extra_ignore: NullableStringArray,
  model: NullableString,
  prompt: NullableString,
  agent_context: z.union([
    z.object({
      context: NullableString,
      files: z.record(z.string(), BottomupAgentKnowledgeSchema),
      directories: z.record(z.string(), BottomupAgentKnowledgeSchema),
    }),
    z.null(),
  ]),
  draft: NullableBoolean,
  plan: NullableBoolean,
  recursive: NullableBoolean,
  enrich: NullableBoolean,
  context: NullableString,
});

export const BottomupEnrichCallSchema = z.object({
  type: z.literal('bottomup.enrich'),
  path: z.string().min(1),
  root: NullableString,
  respect_gitignore: NullableBoolean,
  include_hidden: NullableBoolean,
  extra_ignore: NullableStringArray,
  model: NullableString,
  prompt: NullableString,
  agent_context: z.union([
    z.object({
      context: NullableString,
      files: z.record(z.string(), BottomupAgentKnowledgeSchema),
      directories: z.record(z.string(), BottomupAgentKnowledgeSchema),
    }),
    z.null(),
  ]),
  draft: NullableBoolean,
  plan: NullableBoolean,
  allow_partial: NullableBoolean,
  force: NullableBoolean,
  context: NullableString,
});

export const BottomupSummarizeCallSchema = z.object({
  type: z.literal('bottomup.summarize'),
  path: z.string().min(1),
  root: NullableString,
  respect_gitignore: NullableBoolean,
  include_hidden: NullableBoolean,
  extra_ignore: NullableStringArray,
  model: NullableString,
  prompt: NullableString,
  agent_context: z.union([
    z.object({
      context: NullableString,
      files: z.record(z.string(), BottomupAgentKnowledgeSchema),
      directories: z.record(z.string(), BottomupAgentKnowledgeSchema),
    }),
    z.null(),
  ]),
  draft: NullableBoolean,
  plan: NullableBoolean,
  no_partial: NullableBoolean,
});

export const BottomupSummaryCallSchema = z.object({
  type: z.literal('bottomup.summary'),
  path: z.string().min(1),
  root: NullableString,
  format: z.union([z.enum(['markdown', 'json']), z.null()]),
  parent_depth: NullableInteger,
  child_depth: NullableInteger,
  location: NullableString,
  draft: NullableBoolean,
});

export const FileToolCallSchema = z.discriminatedUnion('type', [
  BottomupGenerateCallSchema,
  BottomupSummarizeCallSchema,
  BottomupSummaryCallSchema,
  BottomupEnrichCallSchema,
]);

export type BottomupGenerateCall = z.infer<typeof BottomupGenerateCallSchema>;
export type BottomupSummarizeCall = z.infer<typeof BottomupSummarizeCallSchema>;
export type BottomupSummaryCall = z.infer<typeof BottomupSummaryCallSchema>;
export type BottomupEnrichCall = z.infer<typeof BottomupEnrichCallSchema>;
export type FileToolCall = z.infer<typeof FileToolCallSchema>;

export { FileToolCallSchema as ToolCallSchema };

export const skillDescription =
  'Workspace tree, bottom-up documentation, and folder summaries via local AppWeaver CLI tools. Use these tools to answer questions about what files and directories do without reading source files directly.';

export const skillRules = [
  'File tools run immediately by default and do not require `original_prompt`; `bottomup.generate` additionally supports explicit web-only draft review.',
  'Use `bottomup.generate` to create or refresh source-grounded `.BOTTOMUP.json` knowledge for one directory. It accepts structured context already learned by the calling agent.',
  'Use `bottomup.summarize` to recursively build compact hierarchical summaries from accepted source-grounded records and immediate child summaries.',
  'Use `bottomup.summary` to read current source, compact summary, and valid enrichment knowledge before broad source exploration.',
  'Use `bottomup.enrich` after summarization to propagate explicit, saved, or compact-summary context through current `.BOTTOMUP.json` knowledge without rereading raw source by default.',
  'The purpose of these docs is to preserve stable structural context for future agents so they can understand a subtree with fewer exploratory reads.',
  'Prefer summaries that capture primary responsibility, public/exported entrypoints, important side effects, and local conventions.',
  'Use `root` to define the logical documentation root when a subtree should stay independent from its parent workspace. If omitted, tools use the nearest `.BOTTOMUP.json` marked as a root.',
  'After semantic code edits, ask the user whether to refresh bottom-up knowledge for the touched directory and its ancestors.',
];

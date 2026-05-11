import { z } from 'zod';

const NullableString = z.union([z.string().min(1), z.null()]);
const NullableInteger = z.union([z.int().nonnegative(), z.null()]);
const NullableBoolean = z.union([z.boolean(), z.null()]);
const NullableStringArray = z.union([z.array(z.string().min(1)), z.null()]);

export const BottomupCallSchema = z.object({
  type: z.literal('bottomup'),
  working_dir: NullableString,
  scope_root: NullableString,
  depth: NullableInteger,
  respect_gitignore: NullableBoolean,
  exclude_hidden: NullableBoolean,
  extra_ignore: NullableStringArray,
  include_file_summaries: NullableBoolean,
  model: NullableString,
  max_file_bytes: NullableInteger,
  two_pass: NullableBoolean,
});

export const BottomupContextCallSchema = z.object({
  type: z.literal('bottomup_context'),
  working_dir: NullableString,
  scope_root: NullableString,
  parent_depth: NullableInteger,
  child_depth: NullableInteger,
  respect_gitignore: NullableBoolean,
  exclude_hidden: NullableBoolean,
  extra_ignore: NullableStringArray,
});

export const SummarizeCallSchema = z.object({
  type: z.literal('summarize'),
  working_dir: NullableString,
  scope_root: NullableString,
  depth: NullableInteger,
  respect_gitignore: NullableBoolean,
  exclude_hidden: NullableBoolean,
  extra_ignore: NullableStringArray,
  include_file_summaries: NullableBoolean,
  model: NullableString,
  max_file_bytes: NullableInteger,
  write_summary: NullableBoolean,
});

export const TopdownCallSchema = z.object({
  type: z.literal('topdown'),
  working_dir: NullableString,
  scope_root: NullableString,
  depth: NullableInteger,
  respect_gitignore: NullableBoolean,
  exclude_hidden: NullableBoolean,
  extra_ignore: NullableStringArray,
  model: NullableString,
  force: NullableBoolean,
});

export const FileToolCallSchema = z.discriminatedUnion('type', [
  BottomupCallSchema,
  BottomupContextCallSchema,
  SummarizeCallSchema,
  TopdownCallSchema,
]);

export type BottomupCall = z.infer<typeof BottomupCallSchema>;
export type BottomupContextCall = z.infer<typeof BottomupContextCallSchema>;
export type SummarizeCall = z.infer<typeof SummarizeCallSchema>;
export type TopdownCall = z.infer<typeof TopdownCallSchema>;
export type FileToolCall = z.infer<typeof FileToolCallSchema>;

export { FileToolCallSchema as ToolCallSchema };

export const skillDescription =
  'Workspace tree, bottom-up documentation, and folder summaries via local AppWeaver CLI tools. Use these tools to answer questions about what files and directories do without reading source files directly.';

export const skillRules = [
  'These file tools run immediately. They do not use drafts and do not require `original_prompt`.',
  'Use `bottomup_context` before broad exploration when you want fast context from existing `__BOTTOMUP.md` files.',
  'Use `bottomup` to generate or refresh `__BOTTOMUP.md` depth-first for a subtree.',
  'Use `summarize` with `write_summary: true` to cache `__BOTTOMUP_SUMMARY.md`, then `topdown` to enrich existing docs.',
  'The purpose of these docs is to preserve stable structural context for future agents so they can understand a subtree with fewer exploratory reads.',
  'Prefer summaries that capture primary responsibility, public/exported entrypoints, important side effects, and local conventions.',
  'Use `scope_root` to define the logical documentation root when a subtree should stay independent from its parent workspace. If omitted, tools should respect the nearest ancestor `__BOTTOMUP.md` with `scope_root: true`.',
  'Do not invent or add `scope_root: true` frontmatter unless it already exists or the user explicitly wants to create it.',
  'After code edits, ask the user whether to regenerate affected `__BOTTOMUP.md` files for the touched directory and its ancestors.',
];

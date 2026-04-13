import type {
  BottomupCall,
  BottomupContextCall,
  SummarizeCall,
} from '../../../ai/schema';

import type {
  BottomupResolvedOptions,
  ContextResolvedOptions,
  SummarizeResolvedOptions,
} from './types';
import {
  DEFAULT_CONTEXT_CHILD_DEPTH,
  DEFAULT_CONTEXT_PARENT_DEPTH,
} from './types';

function boolOrDefault(value: boolean | null, fallback: boolean): boolean {
  return value ?? fallback;
}

function intOrDefault(value: number | null, fallback: number): number {
  return value ?? fallback;
}

export function normalizeBottomupOptions(
  call: BottomupCall,
): BottomupResolvedOptions {
  return {
    workingDir: call.working_dir,
    scopeRoot: call.scope_root,
    depth: call.depth,
    respectGitignore: boolOrDefault(call.respect_gitignore, true),
    excludeHidden: boolOrDefault(call.exclude_hidden, true),
    extraIgnore: call.extra_ignore ?? [],
    includeFileSummaries: boolOrDefault(call.include_file_summaries, true),
    model: call.model,
    maxFileBytes: call.max_file_bytes,
    twoPass: boolOrDefault(call.two_pass, false),
  };
}

export function normalizeSummarizeOptions(
  call: SummarizeCall,
): SummarizeResolvedOptions {
  return {
    workingDir: call.working_dir,
    scopeRoot: call.scope_root,
    depth: call.depth,
    respectGitignore: boolOrDefault(call.respect_gitignore, true),
    excludeHidden: boolOrDefault(call.exclude_hidden, true),
    extraIgnore: call.extra_ignore ?? [],
    includeFileSummaries: boolOrDefault(call.include_file_summaries, true),
    model: call.model,
    maxFileBytes: call.max_file_bytes,
    twoPass: false,
  };
}

export function normalizeContextOptions(
  call: BottomupContextCall,
): ContextResolvedOptions {
  return {
    workingDir: call.working_dir,
    scopeRoot: call.scope_root,
    parentDepth: intOrDefault(call.parent_depth, DEFAULT_CONTEXT_PARENT_DEPTH),
    childDepth: intOrDefault(call.child_depth, DEFAULT_CONTEXT_CHILD_DEPTH),
    respectGitignore: boolOrDefault(call.respect_gitignore, true),
    excludeHidden: boolOrDefault(call.exclude_hidden, true),
    extraIgnore: call.extra_ignore ?? [],
  };
}

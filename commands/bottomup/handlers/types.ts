export const BOTTOMUP_FILE = '__BOTTOMUP.md';
export const BOTTOMUP_SUMMARY_FILE = '__BOTTOMUP_SUMMARY.md';
export const TOPDOWN_ENRICHED_VERSION = 1;
export const DEFAULT_CONTEXT_PARENT_DEPTH = 2;
export const DEFAULT_CONTEXT_CHILD_DEPTH = 1;

export const AI_DIRECTORY_SUMMARY_SCHEMA = {
  directory_summary: 'string',
  notes: ['string'],
  files: [{ name: 'string', summary: 'string' }],
  subdirectories: [{ name: 'string', summary: 'string' }],
} as const;

export type BottomupResolvedOptions = {
  workingDir: string | null;
  scopeRoot: string | null;
  depth: number | null;
  respectGitignore: boolean;
  excludeHidden: boolean;
  extraIgnore: string[];
  includeFileSummaries: boolean;
  model: string | null;
  maxFileBytes: number | null;
  twoPass: boolean;
  writeSummary: boolean;
};

export type SummarizeResolvedOptions = BottomupResolvedOptions;

export type ContextResolvedOptions = {
  workingDir: string | null;
  scopeRoot: string | null;
  parentDepth: number;
  childDepth: number;
  respectGitignore: boolean;
  excludeHidden: boolean;
  extraIgnore: string[];
};

export type TopdownResolvedOptions = {
  workingDir: string | null;
  scopeRoot: string | null;
  depth: number | null;
  respectGitignore: boolean;
  excludeHidden: boolean;
  extraIgnore: string[];
  model: string | null;
  force: boolean;
};

export type FileSummary = {
  name: string;
  relativePosix: string;
  summary: string;
};

export type SubdirectorySummary = {
  name: string;
  relativePosix: string;
  summary: string;
};

export type DirectoryNode = {
  name: string;
  relativePosix: string;
  absolutePath: string;
  docRelativePosix: string;
  preserveScopeRootMarker: boolean;
  directHash: string;
  subtreeHash: string;
  fileHashes: Record<string, string>;
  childHashes: Record<string, string>;
  wasSkipped: boolean;
  directorySummary: string;
  notes: string[];
  files: FileSummary[];
  subdirectories: SubdirectorySummary[];
  children: DirectoryNode[];
};

export type ExistingBottomupDoc = {
  preserveScopeRootMarker: boolean;
  directHash: string | null;
  subtreeHash: string | null;
  enriched: boolean;
  enrichedSummaryHash: string | null;
  enrichedVersion: number | null;
  fileHashes: Record<string, string>;
  childHashes: Record<string, string>;
  directorySummary: string | null;
  notes: string[];
  fileSummaries: Record<string, string>;
  subdirectorySummaries: Record<string, string>;
};

export type DirectoryEntry = {
  name: string;
  absolutePath: string;
  relativePosix: string;
  isDirectory: boolean;
};

export type FileSnippet = {
  name: string;
  relativePosix: string;
  sizeBytes: number;
  snippet: string | null;
  skippedReason: string | null;
};

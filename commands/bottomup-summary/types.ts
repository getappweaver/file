import type { BottomupIndex } from '../bottomup-generate/types';

export type SummaryResolvedOptions = {
  path: string;
  root: string | null;
  format: 'markdown' | 'json';
  parentDepth: number;
  childDepth: number;
  location: string | null;
  draft: boolean;
};

export type SummaryNodeView = {
  path: string;
  relation: 'parent' | 'current' | 'child';
  sourceStatus: 'current' | 'missing' | 'stale';
  summaryStatus: 'current' | 'missing' | 'stale';
  enrichmentStatus: 'current' | 'missing' | 'stale';
  summary: string | null;
  sourceSummary: string | null;
  enrichedSummary: string | null;
  coverage: BottomupIndex['coverage'] | null;
  files: Array<{
    path: string;
    status: 'current' | 'missing' | 'stale';
    sourceSummary: string | null;
    enrichedSummary: string | null;
  }>;
};

export type SummaryProjection = {
  path: string;
  root: string;
  rootSource: 'explicit' | 'nearest marked ancestor' | 'workspace fallback';
  requestedFile: string | null;
  parentDepth: number;
  childDepth: number;
  nodes: SummaryNodeView[];
  warnings: string[];
};

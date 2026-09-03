import { hashValue } from '../bottomup-generate/fs';
import {
  BOTTOMUP_SUMMARY_VERSION,
  type BottomupIndex,
} from '../bottomup-generate/types';

export function computeSummaryInputHash(params: {
  index: BottomupIndex;
  children: Array<{
    path: string;
    summary: NonNullable<BottomupIndex['summary']>;
  }>;
  coverage: BottomupIndex['coverage'];
}): string {
  return hashValue({
    version: BOTTOMUP_SUMMARY_VERSION,
    source: {
      inputHash: params.index.source.inputHash,
      directorySummary: params.index.source.directorySummary,
    },
    children: params.children.map((child) => ({
      path: child.path,
      inputHash: child.summary.inputHash,
      value: child.summary.value,
    })),
    coverage: params.coverage,
  });
}

export function computeSummaryHash(
  summary: NonNullable<BottomupIndex['summary']>,
): string {
  return hashValue({ inputHash: summary.inputHash, value: summary.value });
}

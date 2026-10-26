import { basename, relative } from 'path';

import { ripgrep } from 'ripgrep';
import { z } from 'zod';

import { ResourceViewV1 } from '@src/capabilities/resource-view.v1';
import { SearchV1, type SearchResultV1 } from '@src/capabilities/search.v1';
import { defineCapabilityProvider } from '@src/capabilities/types';
import type { WebNodeRoot } from '@src/web/ui-schema';

import { resolveFileWorkspaceRoot } from './commands/shared/workspace-root';
import {
  defaultViewMaxBytes,
  handleViewCommand,
} from './commands/view/handler';
import { renderFileViewWeb } from './commands/view/renderers/web';
import { searchWorkspaceFilesSubstring } from './fuzzy-file-search-provider';

const PROVIDER_ID = 'appweaver-file-plugin/resource-view/v1';
const MAX_CONTENT_OFFSET = 500;

const CursorSchema = z.object({
  query: z.string(),
  workspace: z.string(),
  phase: z.enum(['path', 'content']),
  offset: z.number().int().min(0),
});

const ResourceIdSchema = z.object({
  path: z.string().min(1),
  line: z.number().int().min(1).nullable(),
});

type RipgrepJsonMatch = {
  path: string;
  lineNumber: number;
  column: number;
  line: string;
};

type RipgrepJsonLine = {
  type?: string;
  data?: {
    path?: { text?: string };
    lines?: { text?: string };
    line_number?: number;
    submatches?: Array<{ start?: number }>;
  };
};

type NormalizeMatchPathProps = {
  workspaceRoot: string;
  pathText: string;
};

function normalizeMatchPath(props: NormalizeMatchPathProps): string {
  const rel = relative(props.workspaceRoot, props.pathText).replace(/\\/g, '/');

  if (!rel.startsWith('..') && rel !== '..' && rel.length > 0) {
    return rel;
  }

  return props.pathText.replace(/\\/g, '/');
}

type ParseRipgrepMatchesProps = {
  stdout: string;
  workspaceRoot: string;
  limit: number;
};

function parseRipgrepMatches(
  props: ParseRipgrepMatchesProps,
): RipgrepJsonMatch[] {
  const matches: RipgrepJsonMatch[] = [];

  for (const rawLine of props.stdout.split(/\r?\n/)) {
    if (rawLine.trim().length === 0) {
      continue;
    }

    let event: RipgrepJsonLine;

    try {
      event = JSON.parse(rawLine) as RipgrepJsonLine;
    } catch {
      continue;
    }

    if (event.type !== 'match') {
      continue;
    }

    const path = event.data?.path?.text;
    const line = event.data?.lines?.text;
    const lineNumber = event.data?.line_number;

    if (
      typeof path !== 'string' ||
      typeof line !== 'string' ||
      typeof lineNumber !== 'number'
    ) {
      continue;
    }

    const firstSubmatch = event.data?.submatches?.[0];

    const column =
      typeof firstSubmatch?.start === 'number' ? firstSubmatch.start + 1 : 1;

    matches.push({
      path: normalizeMatchPath({
        workspaceRoot: props.workspaceRoot,
        pathText: path,
      }),
      lineNumber,
      column,
      line: line.replace(/\r?\n$/, ''),
    });

    if (matches.length >= props.limit) {
      break;
    }
  }

  return matches;
}

export const fileSearchProvider = defineCapabilityProvider({
  contract: SearchV1,
  operations: {
    [SearchV1.operations.search.id]: async ({ input }) => {
      const workspaceRoot = resolveFileWorkspaceRoot();

      const cursor =
        input.cursor === null
          ? null
          : CursorSchema.parse(JSON.parse(input.cursor));

      if (
        cursor !== null &&
        (cursor.query !== input.query || cursor.workspace !== workspaceRoot)
      ) {
        throw new Error('Search cursor belongs to another query or workspace.');
      }

      const results: SearchResultV1[] = [];
      const notices: string[] = [];
      let nextCursor: string | null = null;

      if (cursor === null || cursor.phase === 'path') {
        const pathOffset = cursor?.phase === 'path' ? cursor.offset : 0;

        const allPathMatches = searchWorkspaceFilesSubstring({
          workspaceRoot,
          query: input.query,
        });

        const pathHits = allPathMatches.slice(
          pathOffset,
          pathOffset + input.limit,
        );

        for (const relPath of pathHits) {
          results.push({
            id: JSON.stringify(['path', relPath]),
            text: basename(relPath).slice(0, 1000),
            context: relPath.slice(0, 2000),
            address: {
              capability: ResourceViewV1.capability,
              providerId: PROVIDER_ID,
              resourceType: 'file',
              resourceId: JSON.stringify({ path: relPath, line: null }),
              surface: 'timeline' as const,
            },
          });
        }

        if (pathOffset + pathHits.length < allPathMatches.length) {
          nextCursor = JSON.stringify({
            query: input.query,
            workspace: workspaceRoot,
            phase: 'path',
            offset: pathOffset + pathHits.length,
          });

          return { results, nextCursor, notices };
        }
      }

      const remainingLimit = input.limit - results.length;
      const contentOffset = cursor?.phase === 'content' ? cursor.offset : 0;

      if (remainingLimit > 0 && contentOffset < MAX_CONTENT_OFFSET) {
        const args = [
          '--json',
          '--line-number',
          '--column',
          '--smart-case',
          '--fixed-strings',
          '--sort',
          'path',
          '--max-count',
          '100',
          '--glob',
          '!node_modules/**',
          '--glob',
          '!.git/**',
          '--glob',
          '!dist/**',
          '--glob',
          '!build/**',
          '--glob',
          '!.turbo/**',
          '--glob',
          '!*.sqlite*',
          input.query,
          workspaceRoot,
        ];

        try {
          const { code, stdout, stderr } = await ripgrep(args, {
            buffer: true,
          });

          if (code !== 0 && code !== 1) {
            const notice = stderr.trim() || `ripgrep exited with code ${code}`;
            notices.push(notice.slice(0, 500));
          } else {
            const maxToRead = Math.min(
              MAX_CONTENT_OFFSET,
              contentOffset + remainingLimit + 1,
            );

            const contentMatches = parseRipgrepMatches({
              stdout,
              workspaceRoot,
              limit: maxToRead,
            });

            const pageMatches = contentMatches.slice(
              contentOffset,
              contentOffset + remainingLimit,
            );

            for (const match of pageMatches) {
              results.push({
                id: JSON.stringify([
                  'content',
                  match.path,
                  match.lineNumber,
                  match.column,
                ]),
                text: (match.line.trim() || basename(match.path)).slice(
                  0,
                  1000,
                ),
                context:
                  `${match.path}:${match.lineNumber}:${match.column}`.slice(
                    0,
                    2000,
                  ),
                address: {
                  capability: ResourceViewV1.capability,
                  providerId: PROVIDER_ID,
                  resourceType: 'file',
                  resourceId: JSON.stringify({
                    path: match.path,
                    line: match.lineNumber,
                  }),
                  surface: 'timeline' as const,
                },
              });
            }

            if (
              contentMatches.length > contentOffset + remainingLimit &&
              contentOffset + remainingLimit < MAX_CONTENT_OFFSET
            ) {
              nextCursor = JSON.stringify({
                query: input.query,
                workspace: workspaceRoot,
                phase: 'content',
                offset: contentOffset + remainingLimit,
              });
            }
          }
        } catch (error) {
          const errText =
            error instanceof Error ? error.message : String(error);

          notices.push(errText.slice(0, 500));
        }
      }

      return { results, nextCursor, notices };
    },
  },
});

export const fileResourceViewProvider = defineCapabilityProvider({
  contract: ResourceViewV1,
  operations: {
    [ResourceViewV1.operations.open.id]: ({ input }) => {
      let resource: z.infer<typeof ResourceIdSchema>;

      try {
        resource = ResourceIdSchema.parse(JSON.parse(input.resourceId));
      } catch (error) {
        const errorText =
          error instanceof Error ? error.message : 'Invalid resource ID';

        const view = renderFileViewWeb({
          commandAlias: 'file',
          result: { type: 'error', text: errorText },
          previousDir: null,
          highlightLine: null,
          lineScrollToken: null,
        });

        return { status: 'not-found' as const, view };
      }

      if (input.resourceType !== 'file') {
        const view = renderFileViewWeb({
          commandAlias: 'file',
          result: {
            type: 'error',
            text: `Unsupported resource type: ${input.resourceType}`,
          },
          previousDir: null,
          highlightLine: null,
          lineScrollToken: null,
        });

        return { status: 'not-found' as const, view };
      }

      let result: ReturnType<typeof handleViewCommand>;

      try {
        result = handleViewCommand({
          workspaceRoot: resolveFileWorkspaceRoot(),
          relativePath: resource.path,
          maxBytes: defaultViewMaxBytes(),
        });
      } catch (error) {
        result = {
          type: 'error',
          text: error instanceof Error ? error.message : String(error),
        };
      }

      const baseView = renderFileViewWeb({
        commandAlias: 'file',
        result,
        previousDir: null,
        highlightLine: resource.line,
        lineScrollToken: null,
      });

      const view: WebNodeRoot = {
        ...baseView,
        meta: {
          ...baseView.meta,
          arguments: { path: resource.path },
          options: resource.line === null ? {} : { line: resource.line },
        },
      };

      return {
        status:
          result.type === 'ok' ? ('found' as const) : ('not-found' as const),
        view,
      };
    },
  },
});

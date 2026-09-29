import { defineCapabilityProvider } from '@src/capabilities/types';
import { WorkspaceFileViewV1 } from '@src/capabilities/workspace-file-view.v1';

import { resolveFileWorkspaceRoot } from './commands/shared/workspace-root';
import {
  defaultViewMaxBytes,
  handleViewCommand,
} from './commands/view/handler';
import { renderFileViewWeb } from './commands/view/renderers/web';

export const workspaceFileViewProvider = defineCapabilityProvider({
  contract: WorkspaceFileViewV1,
  operations: {
    [WorkspaceFileViewV1.operations.view.id]: ({ input }) => {
      let result: ReturnType<typeof handleViewCommand>;

      try {
        result = handleViewCommand({
          workspaceRoot: resolveFileWorkspaceRoot(),
          relativePath: input.path,
          maxBytes: defaultViewMaxBytes(),
        });
      } catch (error) {
        result = {
          type: 'error',
          text: error instanceof Error ? error.message : String(error),
        };
      }

      const view = renderFileViewWeb({
        commandAlias: 'file',
        result,
        previousDir: null,
        highlightLine: input.line,
        lineScrollToken: null,
      });

      return {
        view: {
          ...view,
          meta: {
            ...view.meta,
            arguments: { path: input.path },
            options: input.line === null ? {} : { line: input.line },
          },
        },
      };
    },
  },
});

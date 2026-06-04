// ---------------------------------------------------------------------------
// plugins/file/init.ts — FilePlugin (no SQLite)
// ---------------------------------------------------------------------------

import { basename } from 'path';

import { parsePluginPackageJson, type BotPlugin } from '@src/core/plugin';

import { handleFile } from './adapter';
import { aiDefinition } from './ai';
import {
  getFileCommandDefinition,
  getFileHelpLines,
} from './commands/help/module';
import { fileStories } from './stories';

const pluginDir = import.meta.dir;
const alias = basename(pluginDir);

const filePkg = parsePluginPackageJson({ pluginDir });

if (!filePkg) {
  throw new Error(
    `File plugin: invalid or missing package.json. Required: name, version, dmBot.coreApiVersion, dmBot.description`,
  );
}

export const FilePlugin: BotPlugin = {
  identity: {
    name: filePkg.name,
    alias,
    version: filePkg.version,
    description: filePkg.description,
  },
  handler: async (args, context) =>
    handleFile({
      args,
      prefix: context.prefix,
      alias,
      source: context.source,
      jsonPayload: context.jsonPayload,
    }),
  onInit: () => {},
  helpText: (a: string, prefix: string) => [
    `Files: browse the workspace tree, inspect git history, generate bottom-up documentation, upload files encrypted for another AppWeaver bot (NIP-17), and download/decrypt by naddr. Commands run immediately (no draft flow).`,
    '',
    `${prefix}${a} help [topic] — detailed help for a subcommand`,
    ...getFileHelpLines(prefix, a),
  ],
  aiDefinition,
  commandDefinition: (prefix: string, pluginAlias: string) =>
    getFileCommandDefinition(prefix, pluginAlias),
  stories: fileStories,
};

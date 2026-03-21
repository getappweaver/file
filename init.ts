// ---------------------------------------------------------------------------
// plugins/file/init.ts — FilePlugin (no SQLite)
// ---------------------------------------------------------------------------

import { basename } from 'path';

import {
  parsePluginPackageJson,
  type BotPlugin,
  type PluginIdentity,
} from '@src/core/plugin';

import { handleFile } from './commands';

const pluginDir = import.meta.dir;
const alias = basename(pluginDir);

const filePkg = parsePluginPackageJson({ pluginDir });

if (!filePkg) {
  throw new Error(
    `File plugin: invalid or missing package.json. Required: name, version, dmBot.coreApiVersion, dmBot.description`,
  );
}

const fileIdentity: PluginIdentity = {
  name: filePkg.name,
  alias,
  version: filePkg.version,
  description: filePkg.description,
};

function fileHelpText(a: string): string[] {
  return [
    `Files: browse the workspace tree, upload files encrypted for another bot (NIP-17), and download/decrypt by naddr. Commands run immediately (no draft flow).`,
    '',
    `!${a} help — this message`,
    `!${a} upload <path> <npub> — encrypt and share a file with another bot`,
    `!${a} download <naddr> — download and decrypt a shared file`,
    `!${a} tree [maxDepth] [targetDir] [--ext ext1,ext2] — workspace tree`,
  ];
}

export const FilePlugin: BotPlugin = {
  identity: fileIdentity,
  handler: (args: string[]) =>
    handleFile({
      args,
      identity: fileIdentity,
      helpText: fileHelpText,
    }),
  onInit: () => {},
  helpText: fileHelpText,
};

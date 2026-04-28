import type { MessageSource } from '@src/messaging';
import type { ParsedCliInvocation } from '@src/system/parser-cli';

import type { getFileCommandDefinition } from '../commands/help/module';

export type FileCommandAdapterParams = {
  prefix: string;
  alias: string;
  source: MessageSource;
  parsed: ParsedCliInvocation;
  command: ReturnType<typeof getFileCommandDefinition>;
};

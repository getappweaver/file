import type { AiDefinition } from '@src/system/ai-definition';

import {
  ToolCallSchema,
  type FileToolCall,
  skillDescription,
  skillRules,
} from './ai/schema';
import { agentInstructions, executeTool, openDb } from './ai/tooling';

export type {
  BottomupCall,
  BottomupContextCall,
  FileToolCall,
  SummarizeCall,
} from './ai/schema';
export { ToolCallSchema, skillDescription, skillRules } from './ai/schema';

export const aiDefinition = {
  toolCallSchema: ToolCallSchema,
  skillDescription,
  skillRules,
  openDb,
  executeTool,
  agentInstructions,
} satisfies AiDefinition<
  typeof ToolCallSchema,
  FileToolCall,
  ReturnType<typeof openDb>
>;

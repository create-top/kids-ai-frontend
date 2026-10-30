// src/pages/chatbot/data.d.ts

export interface ConversationItem {
  key: string;
  label: string;
  /** 预设问题的文案 id，有它时按当前语言显示，不用 label */
  labelId?: string;
  /** today / yesterday / earlier，显示时再翻译 */
  group?: string;
  isDraft?: boolean;
}

export type ParsedMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; thinkContent?: string };

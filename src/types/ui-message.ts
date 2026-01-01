import type { UIMessage } from 'ai';

/**
 * Custom data types for our RAG chatbot
 * Extends AI SDK v5 UIMessage with application-specific data parts
 */

export interface SourceData {
  id: string;
  title: string;
  content: string;
  similarity: number;
}

/**
 * Custom data types registry for UIMessage
 * Maps data part names to their payload types
 */
export interface CustomDataTypes {
  sources: SourceData[];
}

/**
 * Custom UIMessage type with our application-specific data parts
 * Usage: useChat<CustomUIMessage>({ ... })
 */
export type CustomUIMessage = UIMessage<CustomDataTypes>;

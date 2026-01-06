/**
 * Type definitions for chat logging and governance
 */

import type { DocumentSource } from './sources';

export interface LogChatMessageParams {
  request: Request;
  role: 'user' | 'assistant' | 'system';
  content: string;
  messageIndex: number;

  // Assistant-specific metadata
  modelName?: string;
  temperature?: number;
  latencyMs?: number;
  tokenCount?: number;
  promptTokens?: number;
  completionTokens?: number;

  // RAG sources (for assistant messages)
  sources?: DocumentSource[];

  // Error tracking
  hasError?: boolean;
  errorMessage?: string;
}

export interface ChatSession {
  id: string;
  sessionId: string;
  ipHash: string;
  userAgent?: string;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceType?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  latitude?: string;
  longitude?: string;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  messageCount: number;
  isActive: boolean;
  expiresAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  messageIndex: number;
  createdAt: Date;
  modelName?: string;
  temperature?: number;
  latencyMs?: number;
  tokenCount?: number;
  promptTokens?: number;
  completionTokens?: number;
  hasError: boolean;
  errorMessage?: string;
}

export interface MessageChunk {
  id: string;
  messageId: string;
  documentId: number;
  chunkContent: string;
  chunkMetadata?: any;
  similarityScore: number;
  rankPosition: number;
  createdAt: Date;
}

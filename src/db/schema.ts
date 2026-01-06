import { pgTable, serial, text, jsonb, vector, timestamp, uuid, numeric, integer, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Chat sessions table
export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: text('session_id').notNull().unique(),

  // Client metadata
  ipHash: text('ip_hash').notNull(),
  userAgent: text('user_agent'),
  browserName: text('browser_name'),
  browserVersion: text('browser_version'),
  osName: text('os_name'),
  osVersion: text('os_version'),
  deviceType: text('device_type'),

  // Geolocation
  countryCode: text('country_code'),
  region: text('region'),
  city: text('city'),
  latitude: numeric('latitude', { precision: 9, scale: 6 }),
  longitude: numeric('longitude', { precision: 9, scale: 6 }),
  timezone: text('timezone'),

  // Session tracking
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  messageCount: integer('message_count').default(0),
  isActive: boolean('is_active').default(true),
  expiresAt: timestamp('expires_at', { withTimezone: true }).default(sql`NOW() + INTERVAL '90 days'`),
});

// Chat messages table
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),

  // Message content
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),

  // Message metadata
  messageIndex: integer('message_index').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

  // AI response metadata
  modelName: text('model_name'),
  temperature: numeric('temperature', { precision: 3, scale: 2 }),
  latencyMs: integer('latency_ms'),
  tokenCount: integer('token_count'),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),

  // Error tracking
  hasError: boolean('has_error').default(false),
  errorMessage: text('error_message'),
});

// Message chunks table
export const messageChunks = pgTable('message_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => chatMessages.id, { onDelete: 'cascade' }),
  documentId: integer('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),

  // Chunk data
  chunkContent: text('chunk_content').notNull(),
  chunkMetadata: jsonb('chunk_metadata'),

  // Retrieval metadata
  similarityScore: numeric('similarity_score', { precision: 5, scale: 4 }).notNull(),
  rankPosition: integer('rank_position').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

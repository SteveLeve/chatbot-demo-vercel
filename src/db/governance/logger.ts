/**
 * Chat logging service for conversation governance
 * Logs sessions, messages, and RAG retrieval chunks
 */

import { db } from '../index';
import { chatSessions, chatMessages, messageChunks } from '../schema';
import { hashIpAddress } from './privacy';
import { parseUserAgent, extractGeoMetadata, extractIpAddress, type ClientMetadata, type GeoMetadata } from './metadata';
import { getOrCreateSessionId, setSessionCookie } from './session-manager';
import type { DocumentSource } from '../../types/sources';
import { eq, sql } from 'drizzle-orm';

// Enable/disable logging via environment variable
const LOGGING_ENABLED = process.env.CHAT_LOGGING_ENABLED !== 'false';

export interface LogChatMessageParams {
  request: Request;
  role: 'user' | 'assistant';
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

export class ChatLogger {
  private sessionId: string | null = null;
  private sessionDbId: string | null = null;

  /**
   * Initialize session for the request
   */
  async initializeSession(request: Request): Promise<void> {
    if (!LOGGING_ENABLED) return;

    try {
      this.sessionId = await getOrCreateSessionId(request);

      // Check if session already exists in DB
      const existingSession = await db.query.chatSessions.findFirst({
        where: eq(chatSessions.sessionId, this.sessionId),
      });

      if (existingSession) {
        this.sessionDbId = existingSession.id;
        // Update last_message_at
        await db.update(chatSessions)
          .set({
            lastMessageAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(chatSessions.id, existingSession.id));
      } else {
        // Create new session
        this.sessionDbId = await this.createSession(request);
        await setSessionCookie(this.sessionId);
      }
    } catch (error) {
      console.error('[ChatLogger] Failed to initialize session:', error);
      // Don't throw - logging failures shouldn't break chat functionality
    }
  }

  /**
   * Create a new session record
   */
  private async createSession(request: Request): Promise<string> {
    const ip = extractIpAddress(request);
    const ipHash = hashIpAddress(ip);
    const userAgentString = request.headers.get('user-agent') || '';
    const clientMetadata = parseUserAgent(userAgentString);
    const geoMetadata = await extractGeoMetadata(request);

    const [session] = await db.insert(chatSessions).values({
      sessionId: this.sessionId!,
      ipHash,
      userAgent: clientMetadata.userAgent,
      browserName: clientMetadata.browserName,
      browserVersion: clientMetadata.browserVersion,
      osName: clientMetadata.osName,
      osVersion: clientMetadata.osVersion,
      deviceType: clientMetadata.deviceType,
      countryCode: geoMetadata.countryCode,
      region: geoMetadata.region,
      city: geoMetadata.city,
      latitude: geoMetadata.latitude?.toString(),
      longitude: geoMetadata.longitude?.toString(),
      timezone: geoMetadata.timezone,
    }).returning({ id: chatSessions.id });

    return session.id;
  }

  /**
   * Log a chat message (user or assistant)
   */
  async logMessage(params: LogChatMessageParams): Promise<void> {
    if (!LOGGING_ENABLED || !this.sessionDbId) return;

    try {
      // Insert message
      const [message] = await db.insert(chatMessages).values({
        sessionId: this.sessionDbId,
        role: params.role,
        content: params.content,
        messageIndex: params.messageIndex,
        modelName: params.modelName,
        temperature: params.temperature?.toString(),
        latencyMs: params.latencyMs,
        tokenCount: params.tokenCount,
        promptTokens: params.promptTokens,
        completionTokens: params.completionTokens,
        hasError: params.hasError || false,
        errorMessage: params.errorMessage,
      }).returning({ id: chatMessages.id });

      // Log RAG chunks if this is an assistant message with sources
      if (params.role === 'assistant' && params.sources && params.sources.length > 0) {
        await this.logMessageChunks(message.id, params.sources);
      }

      // Update session message count
      await db.execute(
        sql`UPDATE chat_sessions
         SET message_count = message_count + 1,
             last_message_at = NOW()
         WHERE id = ${this.sessionDbId}`
      );
    } catch (error) {
      console.error('[ChatLogger] Failed to log message:', error);
      // Don't throw
    }
  }

  /**
   * Log RAG chunks associated with a message
   */
  private async logMessageChunks(messageId: string, sources: DocumentSource[]): Promise<void> {
    try {
      const chunkValues = sources.map((source, index) => ({
        messageId,
        documentId: (source.metadata as any)?.documentId || 0,
        chunkContent: source.content,
        chunkMetadata: source.metadata,
        similarityScore: source.similarity.toString(),
        rankPosition: index + 1,
      }));

      await db.insert(messageChunks).values(chunkValues);
    } catch (error) {
      console.error('[ChatLogger] Failed to log message chunks:', error);
      // Don't throw
    }
  }

  /**
   * Get session ID (for returning to client if needed)
   */
  getSessionId(): string | null {
    return this.sessionId;
  }
}

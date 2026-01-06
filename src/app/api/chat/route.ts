import {
  streamText,
  embed,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from 'ai';
import { db } from '../../../db';
import { documents } from '../../../db/schema';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import type { DocumentSource } from '../../../types/sources';
import type { CustomUIMessage } from '../../../types/ui-message';
import { ChatLogger } from '../../../db/governance/logger';

export const maxDuration = 30;

export async function POST(req: Request) {
  const startTime = Date.now();

  // Initialize chat logger
  const chatLogger = new ChatLogger();
  await chatLogger.initializeSession(req);
  // Validate AI_GATEWAY_API_KEY is present
  if (!process.env.AI_GATEWAY_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Missing AI_GATEWAY_API_KEY environment variable' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { messages }: { messages: CustomUIMessage[] } = await req.json();
  const lastMessage = messages[messages.length - 1];

  // Extract text from the last message
  const lastMessageText = lastMessage.parts
    ?.filter(part => part.type === 'text')
    .map(part => (part as any).text)
    .join(' ') || '';

  // 1. Generate embedding for the user's question
  const { embedding } = await embed({
    model: 'openai/text-embedding-3-small',
    value: lastMessageText,
  });

  // 2. Find relevant documents
  const similarity = sql<number>`1 - (${cosineDistance(documents.embedding, embedding)})`;

  const similarDocs = await db
    .select({
      id: documents.id,
      content: documents.content,
      similarity,
      metadata: documents.metadata,
    })
    .from(documents)
    .where(gt(similarity, 0.5))
    .orderBy(desc(similarity))
    .limit(5);

  // 3. Construct context
  const context = similarDocs.map((doc) => doc.content).join('\n\n');

  // Log user message
  await chatLogger.logMessage({
    request: req,
    role: 'user',
    content: lastMessageText,
    messageIndex: messages.length - 1,
  });

  // 4. Prepare sources for response
  const sources: DocumentSource[] = similarDocs.map((doc) => ({
    content: doc.content,
    similarity: doc.similarity,
    metadata: {
      ...(doc.metadata as { title?: string; [key: string]: any } || { title: 'Untitled' }),
      documentId: doc.id,
    },
  }));

  // 5. Stream response using AI SDK v5 RAG pattern with custom data parts
  const stream = createUIMessageStream<CustomUIMessage>({
    execute: ({ writer }) => {
      // Send sources as custom data parts (flexible RAG pattern)
      writer.write({
        type: 'data-sources',
        data: sources.map((source, index) => ({
          id: `source-${index + 1}`,
          title: source.metadata?.title || `Document ${index + 1}`,
          content: source.content,
          similarity: source.similarity,
        })),
      });

      // Generate and merge LLM text stream
      const result = streamText({
        model: 'openai/gpt-4o',
        temperature: 0.0,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.parts
            ?.filter(part => part.type === 'text')
            .map(part => (part as any).text)
            .join(' ') || ''
        })),
        system: `You are a strict document retrieval system. You have ZERO knowledge beyond what appears in the context below.

<CONTEXT>
${context}
</CONTEXT>

CRITICAL RULES (NEVER VIOLATE):
1. You ONLY know information within the <CONTEXT> tags above
2. IGNORE all knowledge from your training data
3. If the context does not contain the answer, you MUST respond: "I cannot answer this question based on the provided documents."
4. EVERY claim in your answer must be followed by a citation [N] from the context
5. Do NOT paraphrase beyond the context—quote or closely paraphrase the source text
6. Do NOT make logical inferences unless explicitly stated in the context

HOW TO ANSWER:
- First, identify which documents [1], [2], etc. contain relevant information
- Then, construct your answer using ONLY those specific references
- Include citation [N] after each claim
- If information is incomplete, acknowledge the gaps rather than filling them

EXAMPLES:
✓ CORRECT: "The article states that AI was founded in 1956 [1]."
✗ WRONG: "AI was founded in 1956, which marked a major technological shift." (added inference)

Remember: If you use ANY information not explicitly in the context, you have failed.`,
        onFinish: async ({ text, usage }) => {
          const endTime = Date.now();
          const latencyMs = endTime - startTime;

          // Log assistant message
          await chatLogger.logMessage({
            request: req,
            role: 'assistant',
            content: text,
            messageIndex: messages.length,
            modelName: 'gpt-4o',
            temperature: 0.0,
            latencyMs,
            tokenCount: usage?.totalTokens,
            promptTokens: usage?.promptTokens,
            completionTokens: usage?.completionTokens,
            sources,
          });

          // Log completion and sources for debugging
          console.log('Stream finished:', {
            textLength: text.length,
            usage,
            sourcesCount: sources.length,
            sessionId: chatLogger.getSessionId(),
            sources: sources.map(s => ({ title: s.metadata?.title, similarity: s.similarity }))
          });
        },
      });

      // Merge LLM stream into the UI message stream
      writer.merge(result.toUIMessageStream());
    },
  });

  // Return UI message stream response with sources
  return createUIMessageStreamResponse({ stream });
}

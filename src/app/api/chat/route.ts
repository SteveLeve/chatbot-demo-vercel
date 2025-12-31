import { streamText, embed, convertToModelMessages, UIMessage } from 'ai';
import { db } from '../../../db';
import { documents } from '../../../db/schema';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import type { DocumentSource } from '../../../types/sources';

export const maxDuration = 30;

export async function POST(req: Request) {
  // Validate AI_GATEWAY_API_KEY is present
  if (!process.env.AI_GATEWAY_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Missing AI_GATEWAY_API_KEY environment variable' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();
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

  // 4. Prepare sources for response
  const sources: DocumentSource[] = similarDocs.map((doc) => ({
    content: doc.content,
    similarity: doc.similarity,
    metadata: doc.metadata as { title?: string; [key: string]: any } || { title: 'Untitled' },
  }));

  // 5. Stream response using AI SDK v5 pattern
  const result = streamText({
    model: 'openai/gpt-4o',
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.parts
        ?.filter(part => part.type === 'text')
        .map(part => (part as any).text)
        .join(' ') || ''
    })),
    system: `You are a helpful assistant. Use the following context to answer the user's question. If the answer is not in the context, say you don't know.\n\nContext:\n${context}`,
    onFinish: async ({ text, usage }) => {
      // Log completion for debugging
      console.log('Stream finished:', { textLength: text.length, usage });
    },
  });

  // Create response with sources metadata
  const response = result.toUIMessageStreamResponse();

  // Append sources as data annotation
  // Note: This will need frontend adjustment to read sources from stream data
  return new Response(response.body, {
    headers: {
      ...Object.fromEntries(response.headers),
      'X-Sources': JSON.stringify(sources),
    },
  });
}

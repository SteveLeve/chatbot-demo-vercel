import { streamText, embed, convertToModelMessages, UIMessage } from 'ai';
import { db } from '../../../db';
import { documents } from '../../../db/schema';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';

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
  const lastMessageText = typeof lastMessage.content === 'string' 
    ? lastMessage.content 
    : lastMessage.parts
      ?.filter(part => part.type === 'text')
      .map(part => part.text)
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
    })
    .from(documents)
    .where(gt(similarity, 0.5))
    .orderBy(desc(similarity))
    .limit(5);

  // 3. Construct context
  const context = similarDocs.map((doc) => doc.content).join('\n\n');

  // 4. Stream response using AI SDK v5 pattern
  const result = streamText({
    model: 'openai/gpt-4o',
    messages: messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : msg.parts?.map(p => p.text).join(' ') || ''
    })),
    system: `You are a helpful assistant. Use the following context to answer the user's question. If the answer is not in the context, say you don't know.\n\nContext:\n${context}`,
  });

  return result.toUIMessageStreamResponse();
}

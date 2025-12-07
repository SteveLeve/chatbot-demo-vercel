import { createOpenAI } from '@ai-sdk/openai';
import { streamText, embed } from 'ai';
import { db } from '../../../db';
import { documents } from '../../../db/schema';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';

export const maxDuration = 30;

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY,
    baseURL: process.env.OPENAI_API_KEY ? undefined : (process.env.AI_GATEWAY_API_KEY ? 'https://gateway.ai.vercel.dev/v1' : undefined),
});

export async function POST(req: Request) {
  const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // 1. Generate embedding for the user's question
    const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: lastMessage.content,
    });

    // 2. Find relevant documents
    const similarity = sql<number>`1 - (${cosineDistance(documents.embedding, embedding)})`;

    const similarDocs = await db
        .select({
            content: documents.content,
            similarity,
        })
        .from(documents)
        .where(gt(similarity, 0.5)) // Threshold can be adjusted
        .orderBy(desc(similarity))
        .limit(5);

    // 3. Construct context
    const context = similarDocs.map((doc) => doc.content).join('\n\n');

    // 4. Stream response
    const result = streamText({
        model: openai('gpt-4o'),
        messages,
        system: `You are a helpful assistant. Use the following context to answer the user's question. If the answer is not in the context, say you don't know.\n\nContext:\n${context}`,
  });

    return result.toTextStreamResponse();
}

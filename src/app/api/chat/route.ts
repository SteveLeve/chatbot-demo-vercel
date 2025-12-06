import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, embed } from 'ai';
import { z } from 'zod';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';

export const maxDuration = 30;

const openai = createOpenAI({
  baseURL: 'https://gateway.ai.vercel.dev/v1',
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    system: `You are a helpful assistant. Check your knowledge base before answering any questions.
    Only respond to questions using information from tool calls.
    if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
    tools: {
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        parameters: z.object({
          question: z.string(),
        }),
        execute: async ({ question }: any) => {
          const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: question,
          });
          
          const similarity = sql<number>`1 - (${cosineDistance(documents.embedding, embedding)})`;
          
          const similarGuides = await db
            .select({ name: documents.content, content: documents.content })
            .from(documents)
            .where(gt(similarity, 0.5))
            .orderBy(desc(similarity))
            .limit(4);
          
          return similarGuides.map(guide => guide.content).join('\n\n');
        },
      } as any),
    },
  });

  return result.toTextStreamResponse();
}

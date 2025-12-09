import fs from 'fs';
import path from 'path';
import { embedMany } from 'ai';
import { db } from '../src/db';
import { documents } from '../src/db/schema';
import { config } from 'dotenv';

config({ path: '.env.local' });

const DATA_FILE = path.join(process.cwd(), 'data', 'wikipedia-data.json');

// Simple recursive chunking
function chunkText(text: string, maxChunkSize = 1000, overlap = 200): string[] {
  if (text.length <= maxChunkSize) return [text];

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + maxChunkSize;
    
    if (endIndex < text.length) {
      // Try to break at a period or newline
      const lastPeriod = text.lastIndexOf('.', endIndex);
      const lastNewline = text.lastIndexOf('\n', endIndex);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > startIndex) {
        endIndex = breakPoint + 1;
      }
    }

    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

      startIndex = Math.max(startIndex + 1, endIndex - overlap);
  }

  return chunks;
}

async function main() {
    if (!process.env.AI_GATEWAY_API_KEY || !process.env.DATABASE_URL) {
        console.error('Missing AI_GATEWAY_API_KEY or DATABASE_URL in .env.local');
    process.exit(1);
  }

  console.log('Reading data...');
  const articles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  console.log(`Found ${articles.length} articles.`);

  const allChunks: { content: string; metadata: any }[] = [];

  console.log('Chunking data...');
  for (const article of articles) {
    const chunks = chunkText(article.content);
    for (const chunk of chunks) {
      allChunks.push({
        content: chunk,
        metadata: {
          title: article.title,
          url: article.url,
          articleId: article.id,
        },
      });
    }
  }
  console.log(`Generated ${allChunks.length} chunks.`);

  // Batch process embeddings to avoid rate limits
  const BATCH_SIZE = 100;
  console.log('Generating embeddings and inserting into DB...');

  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i / BATCH_SIZE + 1}/${Math.ceil(allChunks.length / BATCH_SIZE)}...`);

    try {
      const { embeddings } = await embedMany({
        model: 'openai/text-embedding-3-small',
        values: batch.map(c => c.content),
      });

      const values = batch.map((chunk, idx) => ({
        content: chunk.content,
        metadata: chunk.metadata,
        embedding: embeddings[idx],
      }));

      await db.insert(documents).values(values);
    } catch (error) {
      console.error(`Error processing batch ${i}:`, error);
    }
  }

  console.log('Ingestion complete!');
}

main().catch(console.error);

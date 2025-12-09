import fs from 'fs';
import path from 'path';
import { embedMany } from 'ai';
import { db } from '../src/db';
import { documents } from '../src/db/schema';
import { config } from 'dotenv';

config({ path: '.env.local' });

const DATA_DIR = path.join(process.cwd(), 'data', 'wikipedia');

interface Article {
  title: string;
  content: string;
  metadata: {
    categories: string[];
    url: string;
    id: string;
  };
}

// Recursively read all JSON files from a directory
async function readArticlesFromDirectory(dir: string): Promise<Article[]> {
  const articles: Article[] = [];

  if (!fs.existsSync(dir)) {
    console.warn(`Directory ${dir} does not exist`);
    return articles;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively read subdirectories
      const subArticles = await readArticlesFromDirectory(fullPath);
      articles.push(...subArticles);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      // Skip metadata file
      if (entry.name === '_fetch_metadata.json') {
        continue;
      }

      try {
        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        const article = JSON.parse(fileContent);

        // Validate article format
        if (
          typeof article.title === 'string' &&
          typeof article.content === 'string' &&
          article.metadata &&
          typeof article.metadata === 'object'
        ) {
          articles.push(article as Article);
        } else {
          console.warn(`Invalid article format in ${fullPath}, skipping`);
        }
      } catch (error) {
        console.error(`Error reading ${fullPath}:`, error);
      }
    }
  }

  return articles;
}

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

  console.log('Reading articles from directory...');
  const articles = await readArticlesFromDirectory(DATA_DIR);
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
          url: article.metadata.url,
          articleId: article.metadata.id,
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

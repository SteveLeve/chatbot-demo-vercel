import fs from 'fs';
import path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'data', 'wikipedia-data.json');
const TARGET_SIZE_MB = 10;
const TOPICS = [
  'Artificial intelligence',
  'Machine learning',
  'Deep learning',
  'Natural language processing',
  'Large language model',
  'Generative artificial intelligence',
  'History of artificial intelligence',
  'Ethics of artificial intelligence',
  'Computer vision',
  'Reinforcement learning',
  'Neural network',
  'Transformer (machine learning architecture)',
  'GPT-3',
  'GPT-4',
  'OpenAI',
  'Google DeepMind',
  'Anthropic',
  'Meta AI',
  'Vercel',
  'Next.js',
  'React (software)',
  'TypeScript',
  'JavaScript',
  'Web development',
  'Cloud computing',
  'Serverless computing',
  'Edge computing',
  'Database',
  'PostgreSQL',
  'Vector database',
  'RAG (Retrieval-Augmented Generation)',
];

async function fetchPage(title: string) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'extracts',
    exlimit: 'max',
    explaintext: '1',
    titles: title,
    origin: '*',
  });

  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`);
  const data = await response.json();
  const pages = data.query.pages;
  const pageId = Object.keys(pages)[0];
  return pages[pageId];
}

async function main() {
  if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
    fs.mkdirSync(path.join(process.cwd(), 'data'));
  }

  let totalSize = 0;
  const articles = [];

  console.log('Starting download...');

  for (const topic of TOPICS) {
    try {
      console.log(`Fetching: ${topic}`);
      const page = await fetchPage(topic);
      
      if (page.missing) {
        console.log(`  - Missing: ${topic}`);
        continue;
      }

      const content = page.extract;
      if (!content) {
        console.log(`  - No content: ${topic}`);
        continue;
      }

      const article = {
        id: page.pageid,
        title: page.title,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
        content: content,
      };

      articles.push(article);
      const size = Buffer.byteLength(JSON.stringify(article));
      totalSize += size;
      console.log(`  - Downloaded (${(size / 1024).toFixed(2)} KB). Total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

      if (totalSize >= TARGET_SIZE_MB * 1024 * 1024) {
        console.log('Target size reached!');
        break;
      }
    } catch (error) {
      console.error(`Error fetching ${topic}:`, error);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(articles, null, 2));
  console.log(`Saved ${articles.length} articles to ${OUTPUT_FILE}`);
}

main().catch(console.error);

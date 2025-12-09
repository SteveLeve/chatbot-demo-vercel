This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Setup

### 1. Get your AI Gateway API key

To use this application, you'll need a Vercel AI Gateway API key:

1. Visit the [Vercel AI Gateway documentation](https://vercel.com/docs/ai-gateway)
2. Create or use an existing Vercel team
3. Navigate to your team settings and generate an AI Gateway API key

### 2. Configure environment variables

Create a `.env.local` file in the root directory with the following variables:

```env
AI_GATEWAY_API_KEY=your_ai_gateway_key_here
DATABASE_URL=your_postgres_url_here
```

Make sure your PostgreSQL database has the `pgvector` extension enabled.

### 3. Set up Python environment

This project uses Python to fetch Wikipedia data from the Hugging Face dataset. Set up a Python virtual environment:

**Linux/macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

The virtual environment will be created in the `.venv` directory (which is gitignored).

## Data Pipeline

This application uses a two-stage data pipeline to populate the vector database with Wikipedia articles:

```
┌─────────────────────────────────────────────────────────┐
│  Stage 1: Fetch (Python)                                │
│  wikimedia/wikipedia → data/wikipedia/*.json            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Stage 2: Ingest (TypeScript)                           │
│  data/wikipedia/*.json → Neon DB with embeddings        │
└─────────────────────────────────────────────────────────┘
```

### Stage 1: Fetch Wikipedia Data

The fetch script downloads articles from the [wikimedia/wikipedia](https://huggingface.co/datasets/wikimedia/wikipedia) dataset on Hugging Face and saves them as individual JSON files.

**Basic usage:**
```bash
npm run fetch-data
```

This fetches approximately 10MB of Wikipedia articles (default).

**Advanced usage:**

Fetch a specific size in megabytes:
```bash
python scripts/fetch-wikipedia.py --size-mb 50
```

Fetch a specific number of articles:
```bash
python scripts/fetch-wikipedia.py --articles 5000
```

Choose language edition (simple or en):
```bash
python scripts/fetch-wikipedia.py --lang en --size-mb 20
```

Specify custom output directory:
```bash
python scripts/fetch-wikipedia.py --output data/custom-wikipedia
```

**What it does:**
- Downloads articles from the Hugging Face dataset in streaming mode
- Filters out stub articles (< 500 characters)
- Converts articles to RAG-compatible format
- Saves each article as a separate JSON file in `data/wikipedia/`
- Creates `_fetch_metadata.json` with statistics about the fetch operation
- Shows progress every 10 articles

### Stage 2: Ingest Data into Vector Database

The ingest script processes the fetched articles, chunks them, generates embeddings, and stores them in the database.

**Usage:**
```bash
npm run ingest-data
```

**What it does:**
- Reads all JSON files from `data/wikipedia/` directory
- Chunks each article into 1000-character segments with 200-character overlap
- Generates embeddings using OpenAI's `text-embedding-3-small` model via AI Gateway
- Processes embeddings in batches of 100 to respect rate limits
- Inserts chunks with embeddings into the PostgreSQL database

**Note:** Make sure you've set `AI_GATEWAY_API_KEY` and `DATABASE_URL` in `.env.local` before running this script.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Troubleshooting

### Python Environment Issues

**Problem:** `python3: command not found` or `python: command not found`

**Solution:** Install Python 3.8 or higher:
- **macOS:** `brew install python3` or download from [python.org](https://www.python.org/downloads/)
- **Linux:** `sudo apt-get install python3 python3-pip` (Ubuntu/Debian) or `sudo yum install python3 python3-pip` (RHEL/CentOS)
- **Windows:** Download from [python.org](https://www.python.org/downloads/) and ensure "Add Python to PATH" is checked during installation

**Problem:** `pip: command not found`

**Solution:** Install pip:
- **macOS/Linux:** `python3 -m ensurepip --upgrade`
- **Windows:** `python -m ensurepip --upgrade`

**Problem:** Virtual environment activation fails

**Solution:** 
- On **Linux/macOS**, ensure the script is executable: `chmod +x .venv/bin/activate`
- On **Windows PowerShell**, you may need to enable script execution: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Data Fetch Issues

**Problem:** `ModuleNotFoundError: No module named 'datasets'`

**Solution:** Activate the virtual environment and install dependencies:
```bash
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

**Problem:** Fetch script runs out of disk space

**Solution:** Reduce the dataset size using `--size-mb` or `--articles` options:
```bash
python scripts/fetch-wikipedia.py --size-mb 5
```

**Problem:** Network errors during fetch

**Solution:** The script will skip problematic articles and continue. Check `_fetch_metadata.json` for statistics on skipped articles. If many articles are skipped, try running the fetch again.

### Data Ingestion Issues

**Problem:** `Error: Missing AI_GATEWAY_API_KEY environment variable`

**Solution:** Ensure `.env.local` exists and contains your AI Gateway API key:
```env
AI_GATEWAY_API_KEY=your_key_here
DATABASE_URL=your_postgres_url_here
```

**Problem:** `Error: Missing DATABASE_URL environment variable`

**Solution:** Add your PostgreSQL connection string to `.env.local`. Make sure the database has the `pgvector` extension enabled.

**Problem:** `Error: relation "documents" does not exist`

**Solution:** Run database migrations:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

**Problem:** Embedding API rate limit errors

**Solution:** The script processes embeddings in batches of 100. If you encounter rate limits, the batch will be skipped and logged. You can:
- Wait a few minutes and run the script again (it will skip already-ingested articles if you implement deduplication)
- Reduce batch size in `scripts/ingest-data.ts`

**Problem:** `Invalid JSON file` warnings during ingestion

**Solution:** Check that all files in `data/wikipedia/` are valid JSON. Remove any corrupted files and re-run the fetch script if needed.

### Chat/RAG Issues

**Problem:** Chat returns "I don't have enough information" for most questions

**Solution:** 
- Ensure you've run both `npm run fetch-data` and `npm run ingest-data`
- Check that the database contains documents: Connect to your database and run `SELECT COUNT(*) FROM documents;`
- Try fetching more articles for better coverage: `python scripts/fetch-wikipedia.py --size-mb 50`

**Problem:** Slow response times

**Solution:**
- Ensure your database has proper indexes (pgvector index on the embedding column)
- Consider using a database with better performance characteristics
- Reduce the number of retrieved documents in the similarity search query

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

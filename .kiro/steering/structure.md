---
inclusion: always
---

# Project Structure

## Directory Organization

```
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   │   ├── api/chat/     # Chat API endpoint (RAG implementation)
│   │   ├── demos/        # Demo pages (e.g., basic-rag)
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   └── globals.css   # Global styles
│   └── db/               # Database layer
│       ├── index.ts      # Database client initialization
│       └── schema.ts     # Drizzle ORM schema definitions
├── scripts/              # Utility scripts
│   ├── ingest-data.ts    # Data ingestion and embedding generation
│   ├── download-data.ts  # Data fetching utilities
│   └── check-env-and-db.ts
├── data/                 # Static data files
│   └── wikipedia-data.json
├── public/               # Static assets
└── drizzle.config.ts     # Drizzle ORM configuration
```

## Key Patterns

### Path Aliases
- Use `@/*` to import from `src/*` (e.g., `import { db } from '@/db'`)

### API Routes
- Located in `src/app/api/`
- Use Next.js Route Handlers (export POST, GET, etc.)
- Set `maxDuration` for longer-running operations

### Database Access
- Import `db` from `@/db` for database operations
- Import schema types from `@/db/schema`
- Use Drizzle ORM query builder for type-safe queries

### Client Components
- Mark with `'use client'` directive at top of file
- Used for interactive UI (forms, chat interfaces)
- Leverage Vercel AI SDK hooks like `useChat()`

### Vector Search Pattern
1. Generate embedding for user query
2. Calculate cosine similarity with stored embeddings
3. Filter by similarity threshold (typically > 0.5)
4. Order by similarity descending
5. Limit results (typically 5)
6. Inject retrieved context into LLM system prompt

### Data Ingestion
- Chunk large documents (default: 1000 chars with 200 char overlap)
- Break at sentence boundaries when possible
- Batch embed operations (default: 100 chunks per batch)
- Store content, metadata, and embeddings together

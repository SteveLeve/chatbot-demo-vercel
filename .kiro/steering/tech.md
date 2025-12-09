---
inclusion: always
---

# Tech Stack

## Core Framework
- **Next.js 16** (App Router) - React framework with server components
- **React 19** - UI library
- **TypeScript 5** - Type-safe development

## AI & ML
- **Vercel AI SDK** (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`) - AI integration and streaming
- **OpenAI** - LLM (gpt-4o) and embeddings (text-embedding-3-small)
- **AI Gateway** - Optional Vercel AI Gateway for API management

## Database
- **PostgreSQL** with **pgvector** extension - Vector storage and similarity search
- **Drizzle ORM** - Type-safe database queries and schema management
- **node-postgres (pg)** - PostgreSQL client

## Styling
- **Tailwind CSS 4** - Utility-first CSS framework

## Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static type checking

## Common Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint

# Database
npx drizzle-kit generate  # Generate migrations
npx drizzle-kit migrate   # Run migrations
npx drizzle-kit studio    # Open Drizzle Studio

# Data Ingestion
npx tsx scripts/ingest-data.ts  # Ingest Wikipedia data into vector DB
```

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection string (must have pgvector extension)
- `OPENAI_API_KEY` or `AI_GATEWAY_API_KEY` - OpenAI API access

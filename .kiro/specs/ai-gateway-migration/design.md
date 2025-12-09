# Design Document: AI Gateway Migration

## Overview

This design outlines the migration from using the OpenAI provider directly to using the Vercel AI Gateway provider. The migration involves updating two key files: the chat API route and the data ingestion script. The AI Gateway provides a unified interface to OpenAI models while offering benefits such as automatic authentication on Vercel deployments, observability, and simplified credential management.

The migration is straightforward because:
1. The AI SDK automatically uses AI Gateway when model strings are in the `creator/model-name` format
2. The ingestion script already uses AI Gateway correctly
3. Only the chat route needs significant updates

## Architecture

### Current Architecture
```
Chat Route (route.ts)
├── createOpenAI() with fallback logic
│   ├── OPENAI_API_KEY (primary)
│   └── AI_GATEWAY_API_KEY (fallback)
├── openai.embedding('text-embedding-3-small')
└── openai('gpt-4o')

Ingestion Script (ingest-data.ts)
├── createOpenAI() with AI Gateway
│   ├── baseURL: 'https://gateway.ai.vercel.dev/v1'
│   └── apiKey: AI_GATEWAY_API_KEY
└── openai.embedding('text-embedding-3-small')
```

### Target Architecture
```
Chat Route (route.ts)
├── Direct model string usage (AI Gateway automatic)
│   ├── 'openai/gpt-4o'
│   └── 'openai/text-embedding-3-small'
└── Authentication via AI_GATEWAY_API_KEY env var

Ingestion Script (ingest-data.ts)
├── Direct model string usage (AI Gateway automatic)
│   └── 'openai/text-embedding-3-small'
└── Authentication via AI_GATEWAY_API_KEY env var
```

## Components and Interfaces

### 1. Chat API Route (`src/app/api/chat/route.ts`)

**Current Implementation:**
- Uses `createOpenAI()` with custom configuration
- Has fallback logic between OPENAI_API_KEY and AI_GATEWAY_API_KEY
- Manually sets baseURL for AI Gateway

**Target Implementation:**
- Remove provider instance creation
- Use direct model strings: `'openai/gpt-4o'` and `'openai/text-embedding-3-small'`
- AI SDK automatically routes to AI Gateway based on model string format
- Rely on `AI_GATEWAY_API_KEY` environment variable for authentication

### 2. Ingestion Script (`scripts/ingest-data.ts`)

**Current Implementation:**
- Uses `createOpenAI()` with AI Gateway configuration
- Explicitly sets baseURL and apiKey

**Target Implementation:**
- Remove provider instance creation
- Use direct model string: `'openai/text-embedding-3-small'`
- AI SDK automatically routes to AI Gateway
- Rely on `AI_GATEWAY_API_KEY` environment variable for authentication

### 3. Environment Configuration

**Changes:**
- Remove `OPENAI_API_KEY` from documentation and examples
- Make `AI_GATEWAY_API_KEY` the sole authentication method
- Update error messages to reference `AI_GATEWAY_API_KEY`

## Data Models

No changes to data models are required. The vector embeddings and document schema remain unchanged.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Model string format consistency
*For any* AI SDK function call (generateText, streamText, embed, embedMany), when using OpenAI models through AI Gateway, the model string should follow the format `openai/model-name`
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Authentication consistency
*For any* AI operation (chat or embedding generation), the system should authenticate using only the `AI_GATEWAY_API_KEY` environment variable and should not reference `OPENAI_API_KEY`
**Validates: Requirements 1.4, 2.1, 2.2**

### Property 3: Error message clarity
*For any* missing credential scenario, error messages should explicitly mention `AI_GATEWAY_API_KEY` by name and should not reference `OPENAI_API_KEY`
**Validates: Requirements 1.5, 4.1, 4.2, 4.3**

## Error Handling

### Missing Credentials

**Chat Route:**
- Check for `AI_GATEWAY_API_KEY` at runtime
- Return HTTP 500 with clear error message if missing
- Error message format: "Missing AI_GATEWAY_API_KEY environment variable"

**Ingestion Script:**
- Check for `AI_GATEWAY_API_KEY` before processing
- Exit with code 1 and clear error message if missing
- Error message format: "Missing AI_GATEWAY_API_KEY or DATABASE_URL in .env.local"

### API Failures

- Maintain existing error handling for API failures
- AI Gateway errors will be returned by the AI SDK
- No changes needed to existing try-catch blocks

## Testing Strategy

### Unit Testing

We will write focused unit tests to verify:

1. **Model String Format Tests**
   - Verify chat route uses `'openai/gpt-4o'` model string
   - Verify chat route uses `'openai/text-embedding-3-small'` for embeddings
   - Verify ingestion script uses `'openai/text-embedding-3-small'`

2. **Environment Variable Tests**
   - Verify code does not reference `OPENAI_API_KEY`
   - Verify error messages mention `AI_GATEWAY_API_KEY`

3. **Error Handling Tests**
   - Test chat route behavior when `AI_GATEWAY_API_KEY` is missing
   - Test ingestion script behavior when `AI_GATEWAY_API_KEY` is missing

### Property-Based Testing

We will use **fast-check** (JavaScript/TypeScript property-based testing library) to implement property-based tests. Each property test will run a minimum of 100 iterations.

Property-based tests will verify:

1. **Property 1: Model string format consistency**
   - Generate various AI SDK function call scenarios
   - Verify all OpenAI model references use `openai/` prefix format
   - Tag: `**Feature: ai-gateway-migration, Property 1: Model string format consistency**`
   - Validates: Requirements 1.1, 1.2, 1.3

2. **Property 2: Authentication consistency**
   - Generate various code execution paths
   - Verify no references to `OPENAI_API_KEY` exist in runtime code
   - Verify `AI_GATEWAY_API_KEY` is the only authentication method used
   - Tag: `**Feature: ai-gateway-migration, Property 2: Authentication consistency**`
   - Validates: Requirements 1.4, 2.1, 2.2

3. **Property 3: Error message clarity**
   - Generate various error scenarios (missing credentials, API failures)
   - Verify all error messages reference `AI_GATEWAY_API_KEY` when appropriate
   - Verify no error messages reference `OPENAI_API_KEY`
   - Tag: `**Feature: ai-gateway-migration, Property 3: Error message clarity**`
   - Validates: Requirements 1.5, 4.1, 4.2, 4.3

### Integration Testing

Manual integration testing will verify:
- Chat functionality works end-to-end with AI Gateway
- Embedding generation works during data ingestion
- Error messages are clear when credentials are missing

### Testing Framework Configuration

```typescript
// Example fast-check configuration
import fc from 'fast-check';

// Configure to run 100 iterations minimum
fc.assert(
  fc.property(/* generators */, /* test function */),
  { numRuns: 100 }
);
```

## Implementation Notes

### Migration Steps

1. **Update Chat Route**
   - Remove `createOpenAI()` call
   - Replace `openai('gpt-4o')` with direct string `'openai/gpt-4o'`
   - Replace `openai.embedding('text-embedding-3-small')` with direct string `'openai/text-embedding-3-small'`
   - Update error handling to check for `AI_GATEWAY_API_KEY`

2. **Update Ingestion Script**
   - Remove `createOpenAI()` call
   - Replace `openai.embedding('text-embedding-3-small')` with direct string `'openai/text-embedding-3-small'`
   - Update error message to reference only `AI_GATEWAY_API_KEY`

3. **Update Documentation**
   - Update `.kiro/steering/tech.md` to reflect AI Gateway usage
   - Update README.md with AI Gateway setup instructions
   - Remove references to `OPENAI_API_KEY`

### Code Examples

**Before (Chat Route):**
```typescript
const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY,
    baseURL: process.env.OPENAI_API_KEY ? undefined : 'https://gateway.ai.vercel.dev/v1',
});

const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: lastMessageText,
});

const result = streamText({
    model: openai('gpt-4o'),
    // ...
});
```

**After (Chat Route):**
```typescript
const { embedding } = await embed({
    model: 'openai/text-embedding-3-small',
    value: lastMessageText,
});

const result = streamText({
    model: 'openai/gpt-4o',
    // ...
});
```

### Benefits of AI Gateway

1. **Automatic Authentication**: When deployed on Vercel, OIDC authentication works automatically
2. **Observability**: View usage metrics in Vercel dashboard
3. **Unified Interface**: Easy to switch between providers (OpenAI, Anthropic, etc.)
4. **Simplified Code**: No need to manage provider instances
5. **BYOK Support**: Can connect your own OpenAI credentials through Vercel dashboard

## Documentation Updates

### Tech Stack Documentation (`.kiro/steering/tech.md`)

Update the AI & ML section:
```markdown
## AI & ML
- **Vercel AI SDK** - AI integration and streaming
- **Vercel AI Gateway** - Unified interface to OpenAI models with automatic authentication
- **OpenAI Models** - gpt-4o (LLM) and text-embedding-3-small (embeddings) accessed via AI Gateway
```

Update Environment Variables section:
```markdown
## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection string (must have pgvector extension)
- `AI_GATEWAY_API_KEY` - Vercel AI Gateway API key for accessing OpenAI models
```

### README Updates

Add setup instructions:
```markdown
## Setup

1. Get your AI Gateway API key:
   - Visit https://vercel.com/docs/ai-gateway
   - Create or use existing Vercel team
   - Generate an AI Gateway API key

2. Configure environment variables in `.env.local`:
   ```
   AI_GATEWAY_API_KEY=your_key_here
   DATABASE_URL=your_postgres_url_here
   ```
```

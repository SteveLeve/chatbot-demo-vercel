# Requirements Document

## Introduction

This feature migrates the RAG chatbot application from using the OpenAI provider directly to using the Vercel AI Gateway provider. The AI Gateway provides a unified interface to access OpenAI models while offering additional benefits such as automatic authentication on Vercel deployments, observability through the Vercel dashboard, and simplified credential management.

## Glossary

- **AI Gateway**: Vercel's unified interface for accessing AI models from multiple providers (OpenAI, Anthropic, Google, etc.)
- **BYOK**: Bring Your Own Key - connecting your own provider credentials to use with Vercel AI Gateway
- **OIDC**: OpenID Connect - authentication method used by Vercel deployments for automatic authentication
- **RAG System**: The Retrieval-Augmented Generation chatbot that uses vector search to retrieve context before generating responses
- **Ingestion Script**: The script (`scripts/ingest-data.ts`) that processes Wikipedia data and generates embeddings
- **Chat Route**: The API endpoint (`src/app/api/chat/route.ts`) that handles chat requests and performs RAG

## Requirements

### Requirement 1

**User Story:** As a developer, I want to use Vercel AI Gateway instead of direct OpenAI provider, so that I can benefit from unified provider access, automatic authentication on Vercel, and observability features.

#### Acceptance Criteria

1. WHEN the Chat Route initializes the AI provider THEN the system SHALL use the AI Gateway provider with the model string format `openai/gpt-4o`
2. WHEN the Chat Route generates embeddings THEN the system SHALL use the AI Gateway provider with the model string format `openai/text-embedding-3-small`
3. WHEN the Ingestion Script initializes the AI provider THEN the system SHALL use the AI Gateway provider with the model string format `openai/text-embedding-3-small`
4. WHEN the system authenticates with AI Gateway THEN the system SHALL use the `AI_GATEWAY_API_KEY` environment variable
5. WHEN the `AI_GATEWAY_API_KEY` is not present THEN the system SHALL fail with a clear error message indicating the missing key

### Requirement 2

**User Story:** As a developer, I want the OpenAI API key to be removed from the codebase, so that we have a single authentication method and avoid confusion.

#### Acceptance Criteria

1. WHEN the Chat Route is initialized THEN the system SHALL NOT reference the `OPENAI_API_KEY` environment variable
2. WHEN the Ingestion Script is initialized THEN the system SHALL NOT reference the `OPENAI_API_KEY` environment variable
3. WHEN the system checks for required environment variables THEN the system SHALL only require `AI_GATEWAY_API_KEY` and `DATABASE_URL`

### Requirement 3

**User Story:** As a developer, I want the documentation to reflect the AI Gateway usage, so that future developers understand the authentication and configuration requirements.

#### Acceptance Criteria

1. WHEN a developer reads the tech stack documentation THEN the system SHALL describe AI Gateway as the primary authentication method
2. WHEN a developer reads the environment variable documentation THEN the system SHALL list `AI_GATEWAY_API_KEY` as required and SHALL NOT list `OPENAI_API_KEY`
3. WHEN a developer reads the README THEN the system SHALL include instructions for obtaining an AI Gateway API key

### Requirement 4

**User Story:** As a developer, I want consistent error handling for missing credentials, so that I can quickly identify and fix configuration issues.

#### Acceptance Criteria

1. WHEN the Chat Route is called without `AI_GATEWAY_API_KEY` THEN the system SHALL return a clear error response indicating the missing credential
2. WHEN the Ingestion Script is run without `AI_GATEWAY_API_KEY` THEN the system SHALL exit with a clear error message indicating the missing credential
3. WHEN error messages reference missing credentials THEN the system SHALL specify `AI_GATEWAY_API_KEY` by name

# Requirements Document

## Introduction

This feature evolves the data source and import procedure for the RAG demo application. The current implementation fetches Wikipedia articles via the Wikipedia API and stores them in a single JSON file. The new implementation will use the wikimedia/wikipedia dataset from Hugging Face, which provides a standardized, high-quality data source consistent with other RAG demo projects in the portfolio.

## Glossary

- **RAG System**: The Retrieval-Augmented Generation chatbot application
- **wikimedia/wikipedia Dataset**: Hugging Face dataset containing Wikipedia articles in structured format
- **Data Ingestion Pipeline**: The process of fetching, chunking, embedding, and storing Wikipedia articles
- **Python Fetch Script**: Python script that downloads articles from wikimedia/wikipedia dataset
- **TypeScript Ingest Script**: TypeScript script that processes fetched articles and loads them into Neon DB
- **Virtual Environment**: Isolated Python environment for managing dependencies
- **Neon DB**: PostgreSQL database with pgvector extension for vector storage

## Requirements

### Requirement 1

**User Story:** As a developer, I want to use the wikimedia/wikipedia dataset as the data source, so that I have consistent, high-quality data across all RAG demo projects.

#### Acceptance Criteria

1. WHEN the fetch script is executed THEN the System SHALL download articles from the wikimedia/wikipedia dataset using the Hugging Face datasets library
2. WHEN downloading articles THEN the System SHALL support specifying target size in megabytes or article count
3. WHEN downloading articles THEN the System SHALL skip articles shorter than 500 characters to avoid stub articles
4. WHEN downloading articles THEN the System SHALL save each article as an individual JSON file in the data/wikipedia directory
5. WHEN an article is saved THEN the System SHALL convert it from the dataset format to the RAG system format with title, content, and metadata fields

### Requirement 2

**User Story:** As a developer, I want a Python virtual environment setup, so that Python dependencies are isolated and don't conflict with system packages.

#### Acceptance Criteria

1. WHEN setting up the project THEN the System SHALL provide a requirements.txt file listing Python dependencies
2. WHEN the developer runs the setup THEN the System SHALL create a virtual environment in the .venv directory
3. WHEN the virtual environment is activated THEN the System SHALL install the datasets library and its dependencies
4. WHEN Python scripts are executed THEN the System SHALL use the virtual environment's Python interpreter

### Requirement 3

**User Story:** As a developer, I want to ingest fetched Wikipedia articles into Neon DB, so that they are available for vector search in the RAG system.

#### Acceptance Criteria

1. WHEN the ingest script is executed THEN the System SHALL read all JSON files from the data/wikipedia directory
2. WHEN processing articles THEN the System SHALL chunk article content using the existing chunking algorithm with 1000 character chunks and 200 character overlap
3. WHEN chunking is complete THEN the System SHALL generate embeddings for all chunks using the Vercel AI SDK with the text-embedding-3-small model
4. WHEN embeddings are generated THEN the System SHALL insert chunks with their embeddings into the Neon DB documents table
5. WHEN processing batches THEN the System SHALL process embeddings in batches of 100 to avoid rate limits

### Requirement 4

**User Story:** As a developer, I want clear documentation and npm scripts, so that I can easily fetch and ingest Wikipedia data without memorizing commands.

#### Acceptance Criteria

1. WHEN reviewing the README THEN the System SHALL document the Python virtual environment setup process
2. WHEN reviewing the README THEN the System SHALL document the fetch-wikipedia.py script usage with examples
3. WHEN reviewing the README THEN the System SHALL document the ingest-data.ts script usage
4. WHEN the developer runs npm run fetch-data THEN the System SHALL execute the Python fetch script with default parameters
5. WHEN the developer runs npm run ingest-data THEN the System SHALL execute the TypeScript ingest script

### Requirement 5

**User Story:** As a developer, I want the data directory structure to support individual article files, so that articles can be processed incrementally and the system is more maintainable.

#### Acceptance Criteria

1. WHEN articles are fetched THEN the System SHALL create a data/wikipedia directory if it does not exist
2. WHEN saving articles THEN the System SHALL use filesystem-safe filenames derived from article titles
3. WHEN duplicate titles are encountered THEN the System SHALL append a counter to the filename to avoid overwrites
4. WHEN fetch is complete THEN the System SHALL save metadata about the fetch operation to _fetch_metadata.json
5. WHEN the ingest script runs THEN the System SHALL recursively read all JSON files from the data/wikipedia directory

### Requirement 6

**User Story:** As a developer, I want to maintain backward compatibility with the existing RAG system, so that the chat API and vector search continue to work without modifications.

#### Acceptance Criteria

1. WHEN articles are ingested THEN the System SHALL store chunks in the same documents table schema with content, metadata, and embedding fields
2. WHEN metadata is stored THEN the System SHALL include title, url, and id fields matching the existing format
3. WHEN the chat API performs vector search THEN the System SHALL retrieve results using the existing similarity search query
4. WHEN embeddings are generated THEN the System SHALL use the same text-embedding-3-small model as the existing system
5. WHEN chunks are created THEN the System SHALL use the same chunking parameters as the existing system

### Requirement 7

**User Story:** As a developer, I want to clean up obsolete files, so that the codebase remains maintainable and doesn't contain unused code.

#### Acceptance Criteria

1. WHEN the migration is complete THEN the System SHALL remove the scripts/download-data.ts file
2. WHEN the migration is complete THEN the System SHALL remove the data/wikipedia-data.json file if it exists
3. WHEN the migration is complete THEN the System SHALL update .gitignore to exclude data/wikipedia directory
4. WHEN the migration is complete THEN the System SHALL update .gitignore to exclude .venv directory
5. WHEN the migration is complete THEN the System SHALL preserve the existing scripts/ingest-data.ts with modifications to read from data/wikipedia

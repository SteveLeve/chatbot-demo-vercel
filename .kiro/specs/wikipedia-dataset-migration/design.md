# Design Document

## Overview

This design migrates the Wikipedia data source from the Wikipedia API to the wikimedia/wikipedia dataset from Hugging Face. The migration introduces a two-stage pipeline: (1) a Python script fetches articles from the dataset and saves them as individual JSON files, and (2) a TypeScript script ingests these files into Neon DB with embeddings. This approach provides consistency across RAG demo projects while maintaining backward compatibility with the existing vector search implementation.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Data Pipeline                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Fetch Stage (Python)                                     │
│     ┌──────────────────┐                                     │
│     │ wikimedia/       │                                     │
│     │ wikipedia        │                                     │
│     │ (Hugging Face)   │                                     │
│     └────────┬─────────┘                                     │
│              │                                               │
│              ▼                                               │
│     ┌──────────────────┐                                     │
│     │ fetch-wikipedia  │                                     │
│     │ .py              │                                     │
│     └────────┬─────────┘                                     │
│              │                                               │
│              ▼                                               │
│     ┌──────────────────┐                                     │
│     │ data/wikipedia/  │                                     │
│     │ ├─ Article1.json │                                     │
│     │ ├─ Article2.json │                                     │
│     │ └─ ...           │                                     │
│     └────────┬─────────┘                                     │
│              │                                               │
│  2. Ingest Stage (TypeScript)                               │
│              │                                               │
│              ▼                                               │
│     ┌──────────────────┐                                     │
│     │ ingest-data.ts   │                                     │
│     │ - Read files     │                                     │
│     │ - Chunk text     │                                     │
│     │ - Generate       │                                     │
│     │   embeddings     │                                     │
│     └────────┬─────────┘                                     │
│              │                                               │
│              ▼                                               │
│     ┌──────────────────┐                                     │
│     │ Neon DB          │                                     │
│     │ (PostgreSQL +    │                                     │
│     │  pgvector)       │                                     │
│     └──────────────────┘                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction

1. **Fetch Stage**: Python script streams articles from Hugging Face dataset, converts format, and saves to disk
2. **Ingest Stage**: TypeScript script reads saved articles, chunks content, generates embeddings, and inserts into database
3. **Query Stage**: Existing chat API performs vector similarity search (unchanged)

## Components and Interfaces

### 1. Python Fetch Script (`scripts/fetch-wikipedia.py`)

**Purpose**: Download Wikipedia articles from wikimedia/wikipedia dataset

**Dependencies**:
- `datasets` library (Hugging Face)
- `requests` library

**Command-Line Interface**:
```bash
python scripts/fetch-wikipedia.py --size-mb 10
python scripts/fetch-wikipedia.py --articles 2000
python scripts/fetch-wikipedia.py --lang simple|en
python scripts/fetch-wikipedia.py --output data/wikipedia
```

**Key Functions**:

```python
def fetch_wikipedia_dataset(
    output_dir: Path,
    size_mb: float = None,
    article_count: int = None,
    language: str = 'simple',
    split: str = 'train'
) -> Dict[str, Any]:
    """
    Fetch Wikipedia articles and save as individual JSON files.
    
    Returns statistics about the fetch operation.
    """
    pass

def convert_to_rag_format(article: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert wikimedia/wikipedia format to RAG system format.
    
    Input: {'id': '...', 'url': '...', 'title': '...', 'text': '...'}
    Output: {'title': '...', 'content': '...', 'metadata': {...}}
    """
    pass

def clean_article_title(title: str) -> str:
    """Clean article title to be filesystem-safe."""
    pass
```

**Output Format** (per article JSON file):
```json
{
  "title": "Artificial intelligence",
  "content": "Artificial intelligence (AI) is...",
  "metadata": {
    "categories": [],
    "url": "https://en.wikipedia.org/wiki/Artificial_intelligence",
    "id": "1164"
  }
}
```

**Metadata File** (`_fetch_metadata.json`):
```json
{
  "articles_saved": 2000,
  "articles_skipped": 150,
  "total_size_mb": 10.5,
  "average_article_size_kb": 5.25,
  "output_directory": "data/wikipedia",
  "language": "simple"
}
```

### 2. TypeScript Ingest Script (`scripts/ingest-data.ts`)

**Purpose**: Process fetched articles and load into Neon DB with embeddings

**Modified Interface**:
```typescript
async function readArticlesFromDirectory(dir: string): Promise<Article[]> {
  // Recursively read all .json files from data/wikipedia
  // Skip _fetch_metadata.json
  // Parse and validate article format
}

function chunkText(text: string, maxChunkSize = 1000, overlap = 200): string[] {
  // Existing implementation (unchanged)
}

async function main() {
  // 1. Read articles from data/wikipedia directory
  // 2. Chunk all articles
  // 3. Generate embeddings in batches
  // 4. Insert into database
}
```

**Article Interface**:
```typescript
interface Article {
  title: string;
  content: string;
  metadata: {
    categories: string[];
    url: string;
    id: string;
  };
}
```

### 3. Virtual Environment Setup

**Structure**:
```
.venv/                    # Python virtual environment (gitignored)
requirements.txt          # Python dependencies
```

**Setup Commands**:
```bash
python3 -m venv .venv
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### 4. NPM Scripts (`package.json`)

**New Scripts**:
```json
{
  "scripts": {
    "fetch-data": "python3 scripts/fetch-wikipedia.py --size-mb 10",
    "ingest-data": "tsx scripts/ingest-data.ts"
  }
}
```

## Data Models

### Dataset Article Format (Input)

From wikimedia/wikipedia dataset:
```typescript
interface DatasetArticle {
  id: string;           // Wikipedia page ID
  url: string;          // Wikipedia URL
  title: string;        // Article title
  text: string;         // Full article text
}
```

### RAG System Article Format (Intermediate)

Saved to data/wikipedia/*.json:
```typescript
interface RAGArticle {
  title: string;
  content: string;
  metadata: {
    categories: string[];  // Empty for simple Wikipedia
    url: string;
    id: string;
  };
}
```

### Document Chunk Format (Database)

Stored in Neon DB documents table:
```typescript
interface DocumentChunk {
  id: number;              // Auto-generated
  content: string;         // Chunk text
  metadata: {
    title: string;         // Article title
    url: string;           // Wikipedia URL
    articleId: string;     // Wikipedia page ID
  };
  embedding: number[];     // 1536-dimensional vector
  createdAt: Date;         // Auto-generated
}
```

## Data Flow

### 1. Fetch Flow

```
wikimedia/wikipedia dataset (streaming)
  ↓
Filter (skip articles < 500 chars)
  ↓
Convert format (dataset → RAG)
  ↓
Clean title (filesystem-safe)
  ↓
Save to data/wikipedia/{title}.json
  ↓
Update statistics
  ↓
Save _fetch_metadata.json
```

### 2. Ingest Flow

```
Read data/wikipedia/*.json
  ↓
Parse and validate articles
  ↓
Chunk each article (1000 chars, 200 overlap)
  ↓
Batch chunks (100 per batch)
  ↓
Generate embeddings (text-embedding-3-small)
  ↓
Insert into documents table
  ↓
Repeat for all batches
```

### 3. Query Flow (Unchanged)

```
User question
  ↓
Generate embedding
  ↓
Cosine similarity search
  ↓
Filter (similarity > 0.5)
  ↓
Top 5 results
  ↓
Construct context
  ↓
Stream LLM response
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Article format consistency

*For any* article fetched from the dataset, the saved JSON file should contain title, content, and metadata fields with the correct types
**Validates: Requirements 1.5**

### Property 2: Filename safety

*For any* article title, the generated filename should not contain filesystem-unsafe characters (/, \, :, *, ?, ", <, >, |)
**Validates: Requirements 5.2**

### Property 3: Chunk size bounds

*For any* article content, all generated chunks (except possibly the last) should have length between (maxChunkSize - overlap) and maxChunkSize characters
**Validates: Requirements 3.2**

### Property 4: Embedding dimensions

*For any* chunk processed, the generated embedding should have exactly 1536 dimensions
**Validates: Requirements 6.4**

### Property 5: Metadata preservation

*For any* article ingested, all chunks derived from that article should have metadata containing the same title, url, and articleId
**Validates: Requirements 6.2**

### Property 6: Batch processing completeness

*For any* set of chunks, the number of chunks inserted into the database should equal the total number of chunks generated
**Validates: Requirements 3.4**

### Property 7: Directory traversal completeness

*For any* valid JSON file in data/wikipedia (excluding _fetch_metadata.json), the ingest script should read and process that file
**Validates: Requirements 5.5**

## Error Handling

### Fetch Script Errors

| Error Condition | Handling Strategy |
|----------------|-------------------|
| Dataset not found | Exit with error message suggesting valid dataset names |
| Network failure | Skip article, log error, continue with next article |
| Disk full | Exit with error message about disk space |
| Invalid article format | Skip article, increment skipped counter |
| Duplicate filename | Append counter to filename, retry save |

### Ingest Script Errors

| Error Condition | Handling Strategy |
|----------------|-------------------|
| Missing AI_GATEWAY_API_KEY | Exit with error message |
| Missing DATABASE_URL | Exit with error message |
| Invalid JSON file | Log error, skip file, continue with next file |
| Embedding API rate limit | Log error for batch, continue (batch will be skipped) |
| Database connection failure | Exit with error message |
| Invalid article format | Log warning, skip article, continue |

### Environment Setup Errors

| Error Condition | Handling Strategy |
|----------------|-------------------|
| Python not installed | Provide installation instructions in error message |
| pip not available | Provide installation instructions in error message |
| datasets library import fails | Provide pip install command in error message |
| Virtual environment activation fails | Provide platform-specific activation command |

## Testing Strategy

### Unit Tests

**Fetch Script Tests** (Python):
- Test `clean_article_title()` with various unsafe characters
- Test `convert_to_rag_format()` with valid dataset article
- Test `estimate_size()` with various text lengths
- Test filename collision handling

**Ingest Script Tests** (TypeScript):
- Test `readArticlesFromDirectory()` with sample directory
- Test `chunkText()` with various text lengths (existing tests)
- Test article validation with invalid formats
- Test metadata extraction from article files

### Integration Tests

- Test full fetch → ingest → query pipeline with small dataset
- Test that ingested data produces valid vector search results
- Test that embeddings have correct dimensions
- Test that metadata is preserved through the pipeline

### Property-Based Tests

Property-based tests will use the `fast-check` library for TypeScript and Python's `hypothesis` library for Python tests.

**Property 1: Article format consistency**
- Generate random article data
- Convert to RAG format
- Verify all required fields exist with correct types

**Property 2: Filename safety**
- Generate random article titles with unsafe characters
- Clean titles
- Verify no unsafe characters remain

**Property 3: Chunk size bounds**
- Generate random text of various lengths
- Chunk text
- Verify all chunks (except last) are within size bounds

**Property 4: Embedding dimensions**
- Generate random text chunks
- Generate embeddings
- Verify all embeddings have exactly 1536 dimensions

**Property 5: Metadata preservation**
- Generate random article with metadata
- Chunk and process article
- Verify all chunks have identical metadata

**Property 6: Batch processing completeness**
- Generate random number of chunks
- Process in batches
- Verify total processed equals total generated

**Property 7: Directory traversal completeness**
- Create directory with random JSON files
- Run ingest script
- Verify all valid files were processed

## Migration Strategy

### Phase 1: Setup Python Environment
1. Add `requirements.txt` with datasets library
2. Update `.gitignore` to exclude `.venv/`
3. Document virtual environment setup in README

### Phase 2: Add Fetch Script
1. Copy `fetch-wikipedia.py` to `scripts/`
2. Make script executable
3. Add npm script for fetch-data
4. Test fetch with small dataset (--size-mb 1)

### Phase 3: Modify Ingest Script
1. Update `ingest-data.ts` to read from data/wikipedia directory
2. Add directory traversal logic
3. Add JSON validation
4. Preserve existing chunking and embedding logic
5. Test with fetched data

### Phase 4: Update Documentation
1. Add Python setup section to README
2. Document fetch-data command with examples
3. Document ingest-data command
4. Add troubleshooting section

### Phase 5: Cleanup
1. Remove `scripts/download-data.ts`
2. Remove `data/wikipedia-data.json` if exists
3. Update `.gitignore` to exclude `data/wikipedia/`
4. Remove old documentation references

### Phase 6: Validation
1. Run full pipeline: fetch → ingest → query
2. Verify chat API returns relevant results
3. Verify vector search performance
4. Verify metadata is correct in responses

## Backward Compatibility

### Preserved Interfaces

1. **Database Schema**: No changes to documents table
2. **Embedding Model**: Same text-embedding-3-small model
3. **Chunking Algorithm**: Same parameters (1000 chars, 200 overlap)
4. **Metadata Format**: Same fields (title, url, articleId)
5. **Chat API**: No changes required

### Breaking Changes

None. The migration is transparent to the chat API and end users.

## Performance Considerations

### Fetch Performance

- **Streaming**: Dataset loaded in streaming mode to avoid memory issues
- **Progress Updates**: Every 10 articles to provide feedback
- **Disk I/O**: Individual files allow incremental processing
- **Network**: Hugging Face CDN provides fast downloads

### Ingest Performance

- **Batch Size**: 100 chunks per batch balances throughput and rate limits
- **Parallel Processing**: Could be added in future for faster ingestion
- **Memory**: Processes one article at a time to avoid memory issues
- **Database**: Bulk inserts per batch for efficiency

### Query Performance

- **Unchanged**: Vector search performance remains the same
- **Index**: pgvector index on embedding column (existing)
- **Limit**: Top 5 results keeps response time low

## Security Considerations

1. **Environment Variables**: AI_GATEWAY_API_KEY and DATABASE_URL must be protected
2. **File System**: Filename sanitization prevents directory traversal attacks
3. **Input Validation**: JSON parsing validates article format
4. **Rate Limiting**: Batch processing respects API rate limits
5. **Dependencies**: requirements.txt pins versions to avoid supply chain attacks

## Future Enhancements

1. **Incremental Updates**: Track which articles are already ingested
2. **Parallel Processing**: Use worker threads for faster ingestion
3. **Progress Persistence**: Resume interrupted ingestion
4. **Multiple Languages**: Support en, fr, de, etc. Wikipedia editions
5. **Article Filtering**: Allow filtering by categories or topics
6. **Deduplication**: Detect and skip duplicate articles
7. **Compression**: Compress stored articles to save disk space

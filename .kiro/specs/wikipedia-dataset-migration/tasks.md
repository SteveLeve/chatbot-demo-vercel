# Implementation Plan

- [x] 1. Setup Python environment and dependencies
  - Create requirements.txt with datasets library and dependencies
  - Update .gitignore to exclude .venv/ directory
  - Update .gitignore to exclude data/wikipedia/ directory
  - _Requirements: 2.1, 2.2, 5.3_

- [x] 2. Add Python fetch script
  - Copy fetch-wikipedia.py to scripts/ directory
  - Implement fetch_wikipedia_dataset() function with streaming support
  - Implement convert_to_rag_format() function for format conversion
  - Implement clean_article_title() function for filesystem-safe filenames
  - Add command-line argument parsing for size-mb, articles, lang, and output options
  - Add progress reporting every 10 articles
  - Add metadata file generation (_fetch_metadata.json)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4_

- [ ]* 2.1 Write property test for filename safety
  - **Property 2: Filename safety**
  - **Validates: Requirements 5.2**

- [ ]* 2.2 Write property test for article format consistency
  - **Property 1: Article format consistency**
  - **Validates: Requirements 1.5**

- [x] 3. Modify TypeScript ingest script
  - Add readArticlesFromDirectory() function to recursively read JSON files
  - Add JSON validation for article format
  - Skip _fetch_metadata.json file during directory traversal
  - Update main() to read from data/wikipedia instead of single JSON file
  - Preserve existing chunkText() function
  - Preserve existing embedding generation logic
  - Preserve existing batch processing logic
  - Update metadata extraction to use article.metadata fields
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 3.1 Write property test for chunk size bounds
  - **Property 3: Chunk size bounds**
  - **Validates: Requirements 3.2**

- [ ]* 3.2 Write property test for metadata preservation
  - **Property 5: Metadata preservation**
  - **Validates: Requirements 6.2**

- [ ]* 3.3 Write property test for directory traversal completeness
  - **Property 7: Directory traversal completeness**
  - **Validates: Requirements 5.5**

- [x] 4. Add npm scripts
  - Add "fetch-data" script to package.json that runs Python fetch script with default parameters
  - Add "ingest-data" script to package.json that runs TypeScript ingest script
  - _Requirements: 4.4, 4.5_

- [x] 5. Update documentation
  - Add Python virtual environment setup section to README with platform-specific commands
  - Document fetch-wikipedia.py usage with examples for size-mb, articles, and lang options
  - Document ingest-data.ts usage
  - Add data pipeline overview section
  - Add troubleshooting section for common errors
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Test full pipeline
  - Run fetch-data with small dataset (--size-mb 1)
  - Verify JSON files are created in data/wikipedia
  - Verify _fetch_metadata.json is created
  - Run ingest-data script
  - Verify chunks are inserted into database
  - Test chat API with sample queries
  - Verify vector search returns relevant results
  - _Requirements: 6.3_

- [ ] 8. Cleanup obsolete files
  - Remove scripts/download-data.ts
  - Remove data/wikipedia-data.json if it exists
  - Remove references to old download script from documentation
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 9. Final validation
  - Run full pipeline with default dataset size (10MB)
  - Verify all articles are fetched and ingested
  - Verify chat API performance is acceptable
  - Verify metadata is correct in chat responses
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

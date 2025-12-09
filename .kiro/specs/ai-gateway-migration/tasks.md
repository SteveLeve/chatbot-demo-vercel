# Implementation Plan

- [x] 1. Update Chat API Route to use AI Gateway
- [x] 1.1 Remove createOpenAI provider instance
  - Remove the `createOpenAI()` call and configuration
  - Remove the `openai` constant
  - _Requirements: 1.1, 2.1_

- [x] 1.2 Update embedding generation to use direct model string
  - Replace `openai.embedding('text-embedding-3-small')` with `'openai/text-embedding-3-small'`
  - Verify the embed function call works with string model identifier
  - _Requirements: 1.2_

- [x] 1.3 Update text generation to use direct model string
  - Replace `openai('gpt-4o')` with `'openai/gpt-4o'`
  - Verify the streamText function call works with string model identifier
  - _Requirements: 1.1_

- [x] 1.4 Add environment variable validation
  - Add check for `AI_GATEWAY_API_KEY` at the start of the POST handler
  - Return clear error response if missing
  - _Requirements: 1.4, 1.5, 4.1_

- [ ]* 1.5 Write property test for model string format
  - **Property 1: Model string format consistency**
  - **Validates: Requirements 1.1, 1.2, 1.3**
  - Verify all model references use `openai/` prefix format

- [ ]* 1.6 Write unit tests for chat route
  - Test successful chat flow with AI Gateway
  - Test error handling when `AI_GATEWAY_API_KEY` is missing
  - _Requirements: 1.1, 1.2, 4.1_

- [x] 2. Update Ingestion Script to use AI Gateway
- [x] 2.1 Remove createOpenAI provider instance
  - Remove the `createOpenAI()` call and configuration
  - Remove the `openai` constant
  - _Requirements: 1.3, 2.2_

- [x] 2.2 Update embedding generation to use direct model string
  - Replace `openai.embedding('text-embedding-3-small')` with `'openai/text-embedding-3-small'`
  - Verify the embedMany function call works with string model identifier
  - _Requirements: 1.3_

- [x] 2.3 Update environment variable validation
  - Update error message to reference only `AI_GATEWAY_API_KEY`
  - Ensure check happens before any processing
  - _Requirements: 2.3, 4.2, 4.3_

- [ ]* 2.4 Write property test for authentication consistency
  - **Property 2: Authentication consistency**
  - **Validates: Requirements 1.4, 2.1, 2.2**
  - Verify no references to `OPENAI_API_KEY` in runtime code
  - Verify `AI_GATEWAY_API_KEY` is the only authentication method

- [x] 2.5 Write unit tests for ingestion script
  - Test successful embedding generation with AI Gateway
  - Test error handling when `AI_GATEWAY_API_KEY` is missing
  - _Requirements: 1.3, 4.2_

- [x] 3. Update Documentation
- [x] 3.1 Update tech stack documentation
  - Modify `.kiro/steering/tech.md` to describe AI Gateway as primary method
  - Update AI & ML section to mention AI Gateway
  - Update Environment Variables section to list only `AI_GATEWAY_API_KEY`
  - _Requirements: 3.1, 3.2_

- [x] 3.2 Update README with AI Gateway setup instructions
  - Add section explaining how to obtain AI Gateway API key
  - Update environment variable setup instructions
  - Remove any references to `OPENAI_API_KEY`
  - _Requirements: 3.3_

- [x] 3.3 Write property test for error message clarity
  - **Property 3: Error message clarity**
  - **Validates: Requirements 1.5, 4.1, 4.2, 4.3**
  - Verify error messages reference `AI_GATEWAY_API_KEY`
  - Verify no error messages reference `OPENAI_API_KEY`

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

# Sources Display - Test Plan

**Feature**: AI SDK v5 RAG-Optimized Sources Display
**Implementation**: Custom data parts with `createUIMessageStream`
**Date**: 2025-12-31

## Overview

This test plan verifies that document sources are properly streamed, displayed, and accessible in the Vercel RAG chatbot demo.

---

## Prerequisites

- [ ] Environment variables configured (`.env.local` with `AI_GATEWAY_API_KEY`)
- [ ] Database has documents loaded (check with query that should return results)
- [ ] Dependencies installed (`npm install`)
- [ ] Build passes (`npm run build`)

---

## Test Environment Setup

```bash
# Start development server
cd /home/steve-leve/projects/chatbot-demo-vercel
npm run dev

# Open browser to
http://localhost:3000/demos/basic-rag
```

---

## Test Cases

### TC-001: Basic Sources Display

**Objective**: Verify sources appear for a successful query

**Steps**:
1. Navigate to `/demos/basic-rag`
2. Enter question: "What is artificial intelligence?"
3. Submit and wait for response

**Expected Results**:
- ✅ Response text appears with citation markers [1], [2], etc.
- ✅ SourcesCard component appears below response
- ✅ "Sources (N)" header displays with count
- ✅ Each source shows:
  - Number badge (1, 2, 3...)
  - Document title
  - Similarity percentage (e.g., "87.3% match")
  - Preview text (truncated with line-clamp-3)
- ✅ Sources are initially expanded (isOpen: true)

**Test Data**:
```
Question: "What is artificial intelligence?"
Expected: 1-5 sources with similarity > 50%
```

---

### TC-002: Sources Collapsibility

**Objective**: Verify collapsible behavior

**Steps**:
1. Complete TC-001 to get a response with sources
2. Click the "Sources (N)" header button
3. Observe UI change
4. Click header again

**Expected Results**:
- ✅ First click: Sources list collapses, arrow changes from ▼ to ▶
- ✅ Second click: Sources list expands, arrow changes from ▶ to ▼
- ✅ Smooth transition (no visual glitches)
- ✅ State persists during interaction

---

### TC-003: Multiple Messages with Sources

**Objective**: Verify sources display independently per message

**Steps**:
1. Ask question 1: "What is machine learning?"
2. Wait for response and verify sources
3. Ask question 2: "Who founded OpenAI?"
4. Wait for response and verify sources
5. Scroll up to view both responses

**Expected Results**:
- ✅ Each assistant message has its own SourcesCard
- ✅ Sources are different between messages
- ✅ Collapsing one message's sources doesn't affect others
- ✅ Both messages remain accessible via scroll

**Test Data**:
```
Question 1: "What is machine learning?"
Question 2: "Who founded OpenAI?"
Expected: Different sources for each response
```

---

### TC-004: No Sources Available

**Objective**: Verify graceful handling when no sources found

**Steps**:
1. Ask a question unlikely to match documents: "What is the price of Bitcoin today?"
2. Wait for response

**Expected Results**:
- ✅ Assistant responds with: "I cannot answer this question based on the provided documents."
- ✅ No SourcesCard appears (0 sources)
- ✅ No errors in browser console
- ✅ Message bubble renders normally

---

### TC-005: Similarity Score Accuracy

**Objective**: Verify similarity scores are calculated correctly

**Steps**:
1. Ask: "What is RAG?"
2. Inspect similarity percentages shown

**Expected Results**:
- ✅ Similarity scores are between 50.0% and 100.0%
- ✅ Scores are displayed with 1 decimal place (e.g., "87.3%")
- ✅ Highest similarity source appears first
- ✅ Sources are ordered by similarity (descending)

---

### TC-006: Citation Markers Match Sources

**Objective**: Verify citation numbers in text correspond to sources

**Steps**:
1. Ask: "Who founded OpenAI?"
2. Read the response text
3. Note citation markers [1], [2], etc.
4. Expand sources (if collapsed)
5. Compare citation numbers to source order

**Expected Results**:
- ✅ Citation [1] references the first source
- ✅ Citation [2] references the second source
- ✅ All citations have corresponding sources
- ✅ Source numbering starts at 1 (not 0)

---

### TC-007: Long Content Truncation

**Objective**: Verify long source content is properly truncated

**Steps**:
1. Find a query that returns sources with long text
2. Examine source preview text

**Expected Results**:
- ✅ Content is limited to 3 lines (`line-clamp-3`)
- ✅ Truncated content shows "..." at end (CSS ellipsis)
- ✅ Full text is not visible (no overflow)

---

### TC-008: Streaming Behavior

**Objective**: Verify sources appear during/after stream

**Steps**:
1. Open browser DevTools → Network tab
2. Ask a question
3. Watch the response stream in real-time
4. Note when sources appear in UI

**Expected Results**:
- ✅ "Thinking..." indicator shows during generation
- ✅ Sources may appear before text finishes streaming
- ✅ Sources persist after text stream completes
- ✅ No flicker or re-render of sources

---

### TC-009: Mobile Responsiveness

**Objective**: Verify sources display on mobile viewports

**Steps**:
1. Open DevTools → Toggle device toolbar
2. Select "iPhone 14 Pro" (or similar)
3. Complete TC-001 test case

**Expected Results**:
- ✅ SourcesCard fits within viewport (max-w-[80%])
- ✅ Text remains readable (font sizes appropriate)
- ✅ Collapse/expand button is tappable
- ✅ No horizontal scroll needed

---

### TC-010: TypeScript Type Safety

**Objective**: Verify type safety of custom data parts

**Steps**:
1. Open `src/app/demos/basic-rag/page.tsx` in editor
2. Locate `message.parts.find(part => part.type === 'data-sources')`
3. Hover over variables to inspect types
4. Attempt to access invalid properties

**Expected Results**:
- ✅ `message` has type `CustomUIMessage`
- ✅ `sourcesPart.data` has type `SourceData[]`
- ✅ TypeScript errors for invalid property access
- ✅ Autocomplete works for `source.title`, `source.similarity`, etc.

---

## Browser Console Checks

During all tests, monitor browser console for:

### Expected Console Output
```
Stream finished: {
  textLength: <number>,
  usage: { promptTokens: <n>, completionTokens: <n> },
  sourcesCount: <n>,
  sources: [
    { title: "...", similarity: 0.XX },
    ...
  ]
}
```

### Must NOT See
- ❌ React warnings about keys
- ❌ Type errors or undefined property access
- ❌ Network request failures (500 errors)
- ❌ "Cannot read property 'X' of undefined"

---

## Network Inspection

### Request Inspection
1. Open DevTools → Network → Filter: `chat`
2. Make a request
3. Inspect the request payload

**Verify**:
- ✅ Request method: `POST`
- ✅ Request body contains `messages` array
- ✅ Last message has `parts` with `type: 'text'`

### Response Inspection
1. Click on the `/api/chat` request
2. Go to Response tab
3. Look for `data-sources` parts in stream

**Verify**:
- ✅ Response is a stream (Transfer-Encoding: chunked)
- ✅ Stream contains `type:"data-sources"` event
- ✅ `data-sources` part has array of source objects
- ✅ Each source has `id`, `title`, `content`, `similarity`

Example stream chunk:
```
data: {"type":"data-sources","data":[{"id":"source-1","title":"...","content":"...","similarity":0.87},...]}
```

---

## Edge Cases

### EC-001: Empty Question
- **Input**: "" (empty string)
- **Expected**: Button disabled, no request sent

### EC-002: Very Long Question
- **Input**: 500+ character question
- **Expected**: Request succeeds (within MAX_QUERY_LENGTH)

### EC-003: Special Characters
- **Input**: "What is AI? <script>alert('test')</script>"
- **Expected**: XSS prevented, query succeeds safely

### EC-004: Rapid Sequential Queries
- **Action**: Submit 3 questions quickly without waiting
- **Expected**: Each response has correct sources, no mixing

### EC-005: Network Interruption
- **Action**: Start query, disable network mid-stream
- **Expected**: Error message, no crash

---

## Performance Benchmarks

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Time to First Source | < 2s | Network tab, first `data-sources` event |
| Total Response Time | < 5s | From submit to stream complete |
| UI Render Time | < 100ms | DevTools → Performance |
| Memory Usage | < 50MB increase | DevTools → Memory profiler |

---

## Regression Tests

Before marking as complete, verify no regressions:

- [ ] User messages still display correctly
- [ ] Chat input field works
- [ ] "Send" button enables/disables properly
- [ ] Scroll behavior works (scrollToBottom)
- [ ] Page header and navigation still functional
- [ ] Landing page (`/`) unaffected

---

## Success Criteria

All tests must pass:
- ✅ TC-001 through TC-010 all pass
- ✅ No console errors during any test
- ✅ No TypeScript build errors
- ✅ Network responses contain `data-sources` parts
- ✅ Sources render with correct data
- ✅ Performance meets benchmarks
- ✅ No regressions in existing features

---

## Automated Test Ideas (Future)

While this is a manual test plan, consider automating:

1. **Playwright E2E Tests**
   ```typescript
   test('sources display after query', async ({ page }) => {
     await page.goto('/demos/basic-rag');
     await page.fill('input', 'What is AI?');
     await page.click('button[type="submit"]');
     await expect(page.locator('text=Sources (')).toBeVisible();
   });
   ```

2. **Jest Unit Tests**
   - Test source extraction logic
   - Test similarity percentage formatting
   - Test SourcesCard component in isolation

3. **Snapshot Tests**
   - Capture UI state with sources expanded
   - Capture UI state with sources collapsed
   - Compare against baseline

---

## Known Limitations

Document any known issues discovered during testing:

- (None identified yet - update during testing)

---

## Test Execution Log

| Test Case | Date | Tester | Result | Notes |
|-----------|------|--------|--------|-------|
| TC-001 | | | ⏸️ Pending | |
| TC-002 | | | ⏸️ Pending | |
| TC-003 | | | ⏸️ Pending | |
| TC-004 | | | ⏸️ Pending | |
| TC-005 | | | ⏸️ Pending | |
| TC-006 | | | ⏸️ Pending | |
| TC-007 | | | ⏸️ Pending | |
| TC-008 | | | ⏸️ Pending | |
| TC-009 | | | ⏸️ Pending | |
| TC-010 | | | ⏸️ Pending | |

---

## Appendix: Debugging Commands

If issues are found during testing:

```bash
# Check database has documents
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite "SELECT COUNT(*) FROM documents;"

# Verify embeddings exist
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite "SELECT COUNT(*) FROM documents WHERE embedding IS NOT NULL;"

# Clear and reload dev server
# Ctrl+C to stop, then:
npm run dev

# Check build output
npm run build 2>&1 | tee build.log

# Inspect message structure in console
# Add to page.tsx temporarily:
console.log('Message structure:', JSON.stringify(message, null, 2));
```

---

## Sign-off

- [ ] All test cases executed
- [ ] No critical issues found
- [ ] Performance acceptable
- [ ] Ready for demo/production

**Tester**: _______________
**Date**: _______________
**Sign-off**: _______________

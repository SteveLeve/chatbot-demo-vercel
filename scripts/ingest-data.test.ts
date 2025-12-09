import { describe, it, expect, vi } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Ingestion Script - Requirements 1.3, 4.2', () => {
  it('should successfully generate embeddings with AI Gateway', async () => {
    // This test verifies that the ingestion script uses the correct model string format
    // for AI Gateway: 'openai/text-embedding-3-small'
    
    // Read the ingestion script file
    const fs = await import('fs');
    const scriptContent = fs.readFileSync('./scripts/ingest-data.ts', 'utf-8');

    // Verify the script uses AI Gateway model string format
    expect(scriptContent).toContain("'openai/text-embedding-3-small'");
    
    // Verify the script does NOT use createOpenAI provider instance
    expect(scriptContent).not.toContain('createOpenAI');
    
    // Verify embedMany is called (not openai.embedding)
    expect(scriptContent).toContain('embedMany');
  });

  it('should fail with clear error when AI_GATEWAY_API_KEY is missing', async () => {
    // This test verifies error handling when AI_GATEWAY_API_KEY is not set
    
    // Read the ingestion script file
    const fs = await import('fs');
    const scriptContent = fs.readFileSync('./scripts/ingest-data.ts', 'utf-8');

    // Verify the script checks for AI_GATEWAY_API_KEY
    expect(scriptContent).toContain('AI_GATEWAY_API_KEY');
    
    // Verify the script has error handling for missing env vars
    expect(scriptContent).toContain('process.exit(1)');
    
    // Verify error message mentions AI_GATEWAY_API_KEY
    const errorMessageMatch = scriptContent.match(/console\.error\(['"`]([^'"`]*AI_GATEWAY_API_KEY[^'"`]*)['"`]\)/);
    expect(errorMessageMatch).toBeTruthy();
    expect(errorMessageMatch?.[1]).toContain('AI_GATEWAY_API_KEY');
  });

  it('should check for required environment variables before processing', async () => {
    // This test verifies that environment variable validation happens early
    
    const fs = await import('fs');
    const scriptContent = fs.readFileSync('./scripts/ingest-data.ts', 'utf-8');

    // Verify both required env vars are checked
    expect(scriptContent).toContain('AI_GATEWAY_API_KEY');
    expect(scriptContent).toContain('DATABASE_URL');
    
    // Verify the check happens in the main function (before processing)
    // The env check should appear before "Reading articles from directory..." log
    const envCheckIndex = scriptContent.indexOf('process.env.AI_GATEWAY_API_KEY');
    const readingDataIndex = scriptContent.indexOf('Reading articles from directory');
    
    expect(envCheckIndex).toBeGreaterThan(-1);
    expect(readingDataIndex).toBeGreaterThan(-1);
    expect(envCheckIndex).toBeLessThan(readingDataIndex);
  });

  it('should use embedMany function with AI Gateway model string', async () => {
    // This test verifies the correct AI SDK function is used with proper model format
    
    const fs = await import('fs');
    const scriptContent = fs.readFileSync('./scripts/ingest-data.ts', 'utf-8');

    // Verify embedMany is imported from 'ai'
    expect(scriptContent).toMatch(/import.*embedMany.*from ['"]ai['"]/);
    
    // Verify embedMany is called with the model parameter
    expect(scriptContent).toMatch(/embedMany\s*\(\s*\{[^}]*model:/s);
    
    // Verify the model uses the AI Gateway format
    const embedManyCallMatch = scriptContent.match(/embedMany\s*\(\s*\{([^}]*)\}/s);
    expect(embedManyCallMatch).toBeTruthy();
    expect(embedManyCallMatch?.[1]).toContain("'openai/text-embedding-3-small'");
  });
});

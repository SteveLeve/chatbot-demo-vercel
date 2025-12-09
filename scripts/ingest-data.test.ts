import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { embedMany } from 'ai';

// Mock dependencies
vi.mock('ai', () => ({
  embedMany: vi.fn(),
}));

vi.mock('../src/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('../src/db/schema', () => ({
  documents: {},
}));

vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn().mockReturnValue(JSON.stringify([
      {
        id: '1',
        title: 'Test Article',
        url: 'https://example.com',
        content: 'This is a test article content.',
      },
    ])),
  },
}));

vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

describe('Ingestion Script', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should successfully generate embeddings with AI Gateway', async () => {
    // Setup environment variables
    process.env.AI_GATEWAY_API_KEY = 'test-key';
    process.env.DATABASE_URL = 'postgresql://test';

    // Mock embedMany to return embeddings
    const mockEmbeddings = [[0.1, 0.2, 0.3]];
    vi.mocked(embedMany).mockResolvedValue({
      embeddings: mockEmbeddings,
    } as any);

    // Import and run the main function
    const { db } = await import('../src/db');
    const ingestModule = await import('./ingest-data');

    // Wait for the script to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify embedMany was called with correct model string
    expect(embedMany).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'openai/text-embedding-3-small',
        values: expect.any(Array),
      })
    );

    // Verify the model string uses AI Gateway format
    const embedManyCall = vi.mocked(embedMany).mock.calls[0][0];
    expect(embedManyCall.model).toBe('openai/text-embedding-3-small');
  });

  it('should fail with clear error when AI_GATEWAY_API_KEY is missing', async () => {
    // Remove AI_GATEWAY_API_KEY
    delete process.env.AI_GATEWAY_API_KEY;
    process.env.DATABASE_URL = 'postgresql://test';

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Import the module (this will execute the main function)
    await import('./ingest-data');

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify error message mentions AI_GATEWAY_API_KEY
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('AI_GATEWAY_API_KEY')
    );

    // Verify process.exit was called with code 1
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should fail with clear error when DATABASE_URL is missing', async () => {
    // Remove DATABASE_URL
    process.env.AI_GATEWAY_API_KEY = 'test-key';
    delete process.env.DATABASE_URL;

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Import the module
    await import('./ingest-data');

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify error message mentions DATABASE_URL
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('DATABASE_URL')
    );

    // Verify process.exit was called with code 1
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });
});

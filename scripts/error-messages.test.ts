import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Feature: ai-gateway-migration, Property 3: Error message clarity
 * Validates: Requirements 1.5, 4.1, 4.2, 4.3
 * 
 * Property: For any missing credential scenario, error messages should explicitly 
 * mention AI_GATEWAY_API_KEY by name and should not reference OPENAI_API_KEY
 */
describe('Property 3: Error message clarity', () => {
  const filesToCheck = [
    'src/app/api/chat/route.ts',
    'scripts/ingest-data.ts',
  ];

  it('should verify all error messages reference AI_GATEWAY_API_KEY', () => {
    // For each file that handles credentials
    for (const filePath of filesToCheck) {
      const fullPath = path.join(process.cwd(), filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Find all error messages (console.error, throw new Error, Response with error)
      const errorPatterns = [
        /console\.error\(['"`]([^'"`]*)['"`)]/g,
        /throw new Error\(['"`]([^'"`]*)['"`)]/g,
        /error:\s*['"`]([^'"`]*)['"`)]/g,
      ];

      let foundCredentialError = false;
      
      for (const pattern of errorPatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const errorMessage = match[1];
          
          // If the error message mentions credentials or API keys
          if (errorMessage.toLowerCase().includes('api') || 
              errorMessage.toLowerCase().includes('key') ||
              errorMessage.toLowerCase().includes('missing') ||
              errorMessage.toLowerCase().includes('credential')) {
            
            foundCredentialError = true;
            
            // It should mention AI_GATEWAY_API_KEY
            expect(
              errorMessage,
              `Error message in ${filePath} should reference AI_GATEWAY_API_KEY: "${errorMessage}"`
            ).toContain('AI_GATEWAY_API_KEY');
          }
        }
      }

      // Verify we found at least one credential-related error in each file
      expect(
        foundCredentialError,
        `Expected to find credential-related error handling in ${filePath}`
      ).toBe(true);
    }
  });

  it('should verify no error messages reference OPENAI_API_KEY', () => {
    // For each file that handles credentials
    for (const filePath of filesToCheck) {
      const fullPath = path.join(process.cwd(), filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Find all error messages
      const errorPatterns = [
        /console\.error\(['"`]([^'"`]*)['"`)]/g,
        /throw new Error\(['"`]([^'"`]*)['"`)]/g,
        /error:\s*['"`]([^'"`]*)['"`)]/g,
      ];

      for (const pattern of errorPatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const errorMessage = match[1];
          
          // No error message should reference OPENAI_API_KEY
          expect(
            errorMessage,
            `Error message in ${filePath} should NOT reference OPENAI_API_KEY: "${errorMessage}"`
          ).not.toContain('OPENAI_API_KEY');
        }
      }
    }
  });

  it('should verify runtime code does not reference OPENAI_API_KEY', () => {
    // This extends the property to verify no runtime code references the old key
    for (const filePath of filesToCheck) {
      const fullPath = path.join(process.cwd(), filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Check for any process.env.OPENAI_API_KEY references
      expect(
        content,
        `${filePath} should not reference process.env.OPENAI_API_KEY`
      ).not.toContain('process.env.OPENAI_API_KEY');
      
      // Check for any OPENAI_API_KEY string references in runtime code
      // (excluding comments)
      const codeWithoutComments = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*/g, ''); // Remove line comments
      
      const openaiKeyMatches = codeWithoutComments.match(/['"`]OPENAI_API_KEY['"`]/g);
      expect(
        openaiKeyMatches,
        `${filePath} should not reference 'OPENAI_API_KEY' string in runtime code`
      ).toBeNull();
    }
  });

  it('should verify AI_GATEWAY_API_KEY is the only authentication method', () => {
    // Verify that AI_GATEWAY_API_KEY is checked in both files
    for (const filePath of filesToCheck) {
      const fullPath = path.join(process.cwd(), filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Should check for AI_GATEWAY_API_KEY
      expect(
        content,
        `${filePath} should check for AI_GATEWAY_API_KEY`
      ).toContain('AI_GATEWAY_API_KEY');
      
      // Should use process.env.AI_GATEWAY_API_KEY
      expect(
        content,
        `${filePath} should reference process.env.AI_GATEWAY_API_KEY`
      ).toContain('process.env.AI_GATEWAY_API_KEY');
    }
  });
});

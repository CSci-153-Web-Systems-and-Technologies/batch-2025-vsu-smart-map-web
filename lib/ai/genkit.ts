import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { apiKeyManager } from './api-key-manager';

// Helper to create a Genkit instance with a specific key
const createGenkit = (apiKey: string) => {
  // We need to set the API key in the environment for the Google AI plugin to pick it up
  // The plugin looks for GOOGLE_GENAI_API_KEY
  process.env.GOOGLE_GENAI_API_KEY = apiKey;

  return genkit({
    plugins: [googleAI()],
    model: gemini15Flash,
  });
};

// Wrapper to run an operation with key rotation
export async function runWithKeyRotation<T>(
  operation: (ai: ReturnType<typeof createGenkit>) => Promise<T>
): Promise<T> {
  const maxRetries = 3; // Prevent infinite loops
  let attempts = 0;

  while (attempts < maxRetries) {
    let currentKey = '';
    try {
      currentKey = apiKeyManager.getNextKey();
      const ai = createGenkit(currentKey);
      return await operation(ai);
    } catch (error: any) {
      attempts++;

      // Check for rate limit errors (429)
      const isRateLimit =
        error?.status === 429 ||
        error?.message?.includes('429') ||
        error?.message?.includes('quota') ||
        error?.response?.status === 429;

      if (isRateLimit && currentKey) {
        console.warn(`Genkit operation failed with rate limit for key ending in ...${currentKey.slice(-4)}, retrying...`);
        apiKeyManager.markKeyFailed(currentKey);
        continue;
      }

      throw error;
    }
  }

  throw new Error('Max retries exceeded for Genkit operation');
}

// Export a default instance for non-rotated usage (e.g. dev)
// This might fail if no keys are valid, but it's useful for type inference
export const ai = createGenkit(process.env.GEMINI_API_KEYS?.split(',')[0] || '');

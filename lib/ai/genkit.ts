import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { apiKeyManager } from './api-key-manager';

const createGenkit = (apiKey: string) => {
  return genkit({
    plugins: [googleAI({ apiKey })],
    model: gemini15Flash,
  });
};

export async function runWithKeyRotation<T>(
  operation: (ai: ReturnType<typeof createGenkit>) => Promise<T>
): Promise<T> {
  const maxRetries = 3;
  let attempts = 0;

  while (attempts < maxRetries) {
    let currentKey = '';
    try {
      currentKey = apiKeyManager.getNextKey();
      const ai = createGenkit(currentKey);
      return await operation(ai);
    } catch (error: unknown) {
      attempts++;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('quota') ||
        err?.response?.status === 429;

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

export const ai = createGenkit(process.env.GEMINI_API_KEYS?.split(',')[0] || '');

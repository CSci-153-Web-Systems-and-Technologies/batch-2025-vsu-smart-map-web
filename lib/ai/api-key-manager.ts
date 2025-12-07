export class ApiKeyManager {
  private keys: string[];
  private failedKeys: Map<string, number> = new Map();
  private readonly COOLDOWN_MS = 5 * 60 * 1000;

  constructor(keys: string[]) {
    this.keys = keys.filter((key) => key.trim().length > 0);
    if (this.keys.length === 0) {
      console.warn('No Gemini API keys provided. Chat features will not work.');
    }
  }

  getNextKey(): string {
    if (this.keys.length === 0) {
      throw new Error('No API keys configured');
    }

    // Filter for ready keys first
    const readyKeys = this.keys.filter((key) => this.isKeyReady(key));

    if (readyKeys.length === 0) {
      throw new Error('All API keys are currently rate limited. Please try again later.');
    }

    // Select a random key from the ready keys
    const randomIndex = Math.floor(Math.random() * readyKeys.length);
    return readyKeys[randomIndex];
  }

  markKeyFailed(key: string) {
    this.failedKeys.set(key, Date.now());
  }

  private isKeyReady(key: string): boolean {
    const lastFailure = this.failedKeys.get(key);
    if (!lastFailure) return true;

    if (Date.now() - lastFailure > this.COOLDOWN_MS) {
      this.failedKeys.delete(key);
      return true;
    }

    return false;
  }
}

const keys = (process.env.GEMINI_API_KEYS || '').split(',').map((k) => k.trim());
export const apiKeyManager = new ApiKeyManager(keys);


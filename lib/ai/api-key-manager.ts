export class ApiKeyManager {
  private keys: string[];
  private currentIndex: number = 0;
  private failedKeys: Map<string, number> = new Map();
  private readonly COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

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

    // Try to find a working key starting from current index
    for (let i = 0; i < this.keys.length; i++) {
      const index = (this.currentIndex + i) % this.keys.length;
      const key = this.keys[index];

      if (this.isKeyReady(key)) {
        this.currentIndex = index;
        return key;
      }
    }

    // If all keys are in cooldown, find the one that expires soonest
    // Or just throw an error if we want to be strict
    throw new Error('All API keys are currently rate limited. Please try again later.');
  }

  markKeyFailed(key: string) {
    this.failedKeys.set(key, Date.now());
    // Move to next key immediately
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
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

// Singleton instance
const keys = (process.env.GEMINI_API_KEYS || '').split(',').map((k) => k.trim());
export const apiKeyManager = new ApiKeyManager(keys);

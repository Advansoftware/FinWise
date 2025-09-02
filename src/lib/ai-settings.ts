/**
 * @fileoverview AI Settings manager for client-side usage
 * For server actions, use the functions in actions.ts instead
 */

import { AICredential } from '@/lib/types';

// Default AI settings
export const DEFAULT_AI_CREDENTIAL: AICredential = {
  id: 'default-fallback',
  name: 'Default Fallback Ollama',
  provider: 'ollama',
  ollamaModel: 'llama3',
  ollamaServerAddress: 'http://127.0.0.1:11434',
  openAIModel: 'gpt-3.5-turbo'
};

// Cache for AI settings
interface CacheEntry {
  credential: AICredential;
  timestamp: number;
}

const settingsCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

/**
 * Clears the AI settings cache for a specific user
 */
export function clearAISettingsCache(userId?: string): void {
  if (userId) {
    settingsCache.delete(userId);
  } else {
    settingsCache.clear();
  }
}

/**
 * Gets AI settings for the current authenticated user (client-side only)
 * For server actions, import getAISettings from actions.ts instead
 */
export async function getActiveAICredentialForCurrentUser(): Promise<AICredential> {
  try {
    if (typeof window === 'undefined') {
      // Server-side, return defaults
      return DEFAULT_AI_CREDENTIAL;
    }

    // Client-side logic would go here
    // For now, return defaults
    return DEFAULT_AI_CREDENTIAL;
  } catch (error) {
    console.error("Error getting current user AI settings:", error);
    return DEFAULT_AI_CREDENTIAL;
  }
}

/**
 * Periodically clean up expired cache entries
 */
function cleanupCache(): void {
  const now = Date.now();
  for (const [userId, entry] of settingsCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      settingsCache.delete(userId);
    }
  }
}

// Set up periodic cache cleanup (client-side only)
if (typeof window !== 'undefined') {
  setInterval(cleanupCache, CACHE_TTL);
}

/**
 * Gets cache statistics for debugging
 */
export function getCacheStats() {
  return {
    size: settingsCache.size,
    entries: Array.from(settingsCache.entries()).map(([userId, entry]) => ({
      userId,
      timestamp: entry.timestamp,
      age: Date.now() - entry.timestamp,
      provider: entry.credential.provider
    }))
  };
}

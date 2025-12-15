// src/services/pluggy/pluggy.client.ts

/**
 * Pluggy API HTTP Client
 * Handles authentication, token caching, and base HTTP operations
 */

import {
  PluggyAuthRequest,
  PluggyAuthResponse,
  PluggyConnectTokenRequest,
  PluggyConnectTokenResponse,
  PluggyError,
} from './pluggy.types';

// Token cache for API key (2h expiry)
interface TokenCache {
  apiKey: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

// Token expiry buffer (refresh 5 min before actual expiry)
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;
// API Key TTL is 2 hours
const API_KEY_TTL_MS = 2 * 60 * 60 * 1000;

/**
 * Pluggy API Client Configuration
 */
export interface PluggyClientConfig {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
}

/**
 * Get Pluggy configuration from environment variables
 */
export function getPluggyConfig(): PluggyClientConfig {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
  const baseUrl = process.env.PLUGGY_BASE_URL || 'https://api.pluggy.ai';

  if (!clientId || !clientSecret) {
    throw new Error(
      'Pluggy configuration missing. Please set PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET environment variables.'
    );
  }

  return { clientId, clientSecret, baseUrl };
}

/**
 * PluggyClient class for making authenticated API requests
 */
export class PluggyClient {
  private config: PluggyClientConfig;

  constructor(config?: PluggyClientConfig) {
    this.config = config || getPluggyConfig();
  }

  /**
   * Get or refresh API key
   */
  async getApiKey(): Promise<string> {
    const now = Date.now();

    // Check if we have a valid cached token
    if (tokenCache && tokenCache.expiresAt > now + TOKEN_EXPIRY_BUFFER_MS) {
      return tokenCache.apiKey;
    }

    // Request new token
    const response = await fetch(`${this.config.baseUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
      } as PluggyAuthRequest),
    });

    if (!response.ok) {
      const error = await this.parseError(response);
      throw new Error(`Pluggy authentication failed: ${error.message}`);
    }

    const data: PluggyAuthResponse = await response.json();

    // Cache the token
    tokenCache = {
      apiKey: data.apiKey,
      expiresAt: now + API_KEY_TTL_MS,
    };

    return data.apiKey;
  }

  /**
   * Create a Connect Token for frontend widget
   * This token expires in 30 minutes
   */
  async createConnectToken(options?: PluggyConnectTokenRequest): Promise<string> {
    const apiKey = await this.getApiKey();

    const response = await fetch(`${this.config.baseUrl}/connect_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(options || {}),
    });

    if (!response.ok) {
      const error = await this.parseError(response);
      throw new Error(`Failed to create connect token: ${error.message}`);
    }

    const data: PluggyConnectTokenResponse = await response.json();
    return data.accessToken;
  }

  /**
   * Make authenticated GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const apiKey = await this.getApiKey();

    let url = `${this.config.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
    });

    if (!response.ok) {
      const error = await this.parseError(response);
      throw new Error(`Pluggy API error (${endpoint}): ${error.message}`);
    }

    return response.json();
  }

  /**
   * Make authenticated POST request
   */
  async post<T>(endpoint: string, body?: Record<string, any>): Promise<T> {
    const apiKey = await this.getApiKey();

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await this.parseError(response);
      throw new Error(`Pluggy API error (${endpoint}): ${error.message}`);
    }

    return response.json();
  }

  /**
   * Make authenticated PATCH request
   */
  async patch<T>(endpoint: string, body: Record<string, any>): Promise<T> {
    const apiKey = await this.getApiKey();

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await this.parseError(response);
      throw new Error(`Pluggy API error (${endpoint}): ${error.message}`);
    }

    return response.json();
  }

  /**
   * Make authenticated DELETE request
   */
  async delete<T = void>(endpoint: string): Promise<T> {
    const apiKey = await this.getApiKey();

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
    });

    if (!response.ok) {
      const error = await this.parseError(response);
      throw new Error(`Pluggy API error (${endpoint}): ${error.message}`);
    }

    // Some DELETE operations return empty body
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }
    return JSON.parse(text);
  }

  /**
   * Parse error response
   */
  private async parseError(response: Response): Promise<PluggyError> {
    try {
      const data = await response.json();
      return {
        code: data.code || response.status,
        message: data.message || response.statusText,
      };
    } catch {
      return {
        code: response.status,
        message: response.statusText || 'Unknown error',
      };
    }
  }

  /**
   * Clear the token cache (useful for testing or forced refresh)
   */
  static clearCache(): void {
    tokenCache = null;
  }
}

/**
 * Singleton instance for convenience
 */
let defaultClient: PluggyClient | null = null;

export function getPluggyClient(): PluggyClient {
  if (!defaultClient) {
    defaultClient = new PluggyClient();
  }
  return defaultClient;
}

/**
 * Reset the default client (useful for testing)
 */
export function resetPluggyClient(): void {
  defaultClient = null;
  PluggyClient.clearCache();
}

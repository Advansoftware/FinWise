
/**
 * @fileoverview This file initializes and a new Genkit AI toolkit instance.
 * It sets up plugins for different AI providers like Google AI and Ollama,
 * and configures the main `ai` object that will be used throughout the application
 * to define and run AI flows.
 */

import {genkit, type Genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {Plugin} from 'genkit/plugins';
import {getAISettings} from '@/app/actions';
import {ollama} from 'genkitx-ollama';
import {openai} from 'genkitx-openai';
import { getAuth } from 'firebase/auth';
import { getFirebase } from '@/lib/firebase';

let ai: Genkit | null = null;
let initPromise: Promise<void> | null = null;

// This is a simple in-memory cache to avoid fetching settings on every call in the same request lifecycle.
let settingsCache: { [key: string]: { settings: AISettings, timestamp: number } } = {};
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

async function initialize() {
  // This initialization runs on the server.
  // We need a way to get the current user's settings.
  // Since server actions don't have a stable user context like a request object,
  // the AI flows that need user-specific settings will have to fetch them.
  // We'll create a default instance here, and flows can create specific instances if needed.
  
  // Default configuration
  ai = genkit({
      plugins: [
          ollama({
            model: 'llama3',
            serverAddress: 'http://127.0.0.1:11434',
          })
      ],
  });
}

/**
 * Ensures that Genkit is initialized before use and returns the AI instance.
 * This prevents race conditions by making sure the configuration is loaded
 * before any AI flows are called.
 * 
 * IMPORTANT: This function now dynamically reconfigures the 'ai' instance
 * based on the user's settings for each call.
 */
export async function getAI(): Promise<Genkit> {
  const { auth } = getFirebase(); // Client-side firebase
  const userId = auth.currentUser?.uid;

  if (!userId) {
    // If no user, return a default instance.
    if (!ai) {
      ai = genkit();
    }
    return ai;
  }
  
  // Check cache first
  const cached = settingsCache[userId];
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return genkit({ plugins: await createPlugins(cached.settings) });
  }

  // Fetch fresh settings
  const settings = await getAISettings(userId);
  settingsCache[userId] = { settings, timestamp: Date.now() };

  const plugins = await createPlugins(settings);
  
  // Return a dynamically configured instance
  return genkit({
    plugins,
  });
}


async function createPlugins(settings: AISettings): Promise<Plugin[]> {
    const plugins: Plugin[] = [];

    if (settings.provider === 'googleai' && settings.googleAIApiKey) {
        plugins.push(googleAI({apiKey: settings.googleAIApiKey}));
    } else if (settings.provider === 'ollama' && settings.ollamaModel) {
        plugins.push(
        ollama({
            model: settings.ollamaModel,
            serverAddress: settings.ollamaServerAddress || 'http://127.0.0.1:11434',
        })
        );
    } else if (
        settings.provider === 'openai' &&
        settings.openAIApiKey &&
        settings.openAIModel
    ) {
        plugins.push(openai({apiKey: settings.openAIApiKey, model: settings.openAIModel}));
    }
    return plugins;
}

// Clean up old cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const userId in settingsCache) {
        if (now - (settingsCache[userId]?.timestamp || 0) > CACHE_TTL) {
            delete settingsCache[userId];
        }
    }
}, CACHE_TTL);


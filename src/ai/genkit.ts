
/**
 * @fileoverview This file initializes and a new Genkit AI toolkit instance.
 * It sets up plugins for different AI providers like Google AI and Ollama,
 * and configures the main `ai` object that will be used throughout the application
 * to define and run AI flows.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {Plugin} from 'genkit/plugins';
import {getAISettings} from '@/app/actions';
import {ollama} from 'genkitx-ollama';
import {openai} from 'genkitx-openai';
import {getAuth} from 'firebase/auth';
import {getFirebase} from '@/lib/firebase';

let ai: ReturnType<typeof genkit>;
let initPromise: Promise<void> | null = null;

async function initialize() {
  // Avoid re-initialization
  if (ai) return;

  const { auth } = getFirebase();
  const userId = auth.currentUser?.uid;

  // Pass an empty string if userId is not available. 
  // getAISettings will handle returning default settings.
  const settings = await getAISettings(userId || '');
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
  } else {
    // If no provider is configured, do not add any plugins.
    // The UI will guide the user to the settings page.
  }

  ai = genkit({
    plugins,
  });
}

/**
 * Ensures that Genkit is initialized before use and returns the AI instance.
 * This prevents race conditions by making sure the configuration is loaded
 * before any AI flows are called.
 */
export async function getAI(): Promise<ReturnType<typeof genkit>> {
  if (!initPromise) {
    initPromise = initialize();
  }
  await initPromise;
  // If initialization failed (e.g., no plugins), `ai` might not be defined.
  // We create an empty instance to prevent the app from crashing.
  if (!ai) {
    ai = genkit();
  }
  return ai;
}

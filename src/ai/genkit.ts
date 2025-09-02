/**
 * @fileoverview This file initializes and a new Genkit AI toolkit instance.
 * It sets up plugins for different AI providers like Google AI and Ollama,
 * and configures the main `ai` object that will be used throughout the application
 * to define and run AI flows.
 */
'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {Plugin} from 'genkit/plugins';
import {getAISettings} from '@/app/actions';
import {ollama} from 'genkitx-ollama';
import {openai} from 'genkitx-openai';

// This is a proxy object that will be used to ensure that Genkit is initialized
// before any of its methods are called. This is necessary because the
// initialization is asynchronous and we don't want to block the entire app
// from rendering while we wait for it to complete.
let ai: ReturnType<typeof genkit>;
let initPromise: Promise<void> | null = null;

async function initialize() {
  const settings = await getAISettings();
  const plugins: Plugin[] = [];

  if (settings.provider === 'googleai' && settings.googleAIApiKey) {
    plugins.push(googleAI({apiKey: settings.googleAIApiKey}));
  } else if (settings.provider === 'ollama' && settings.ollamaModel) {
    plugins.push(
      ollama({
        model: settings.ollamaModel,
        serverAddress: 'http://127.0.0.1:11434',
      })
    );
  } else if (
    settings.provider === 'openai' &&
    settings.openAIApiKey &&
    settings.openAIModel
  ) {
    plugins.push(openai({apiKey: settings.openAIApiKey}));
  } else {
    // Default to Ollama if no provider is set, to avoid crashing on start.
    // The UI will prompt the user to configure the AI provider.
    plugins.push(
      ollama({model: 'llama3', serverAddress: 'http://127.0.0.1:11434'})
    );
  }

  ai = genkit({
    plugins,
  });
}

/**
 * Ensures that Genkit is initialized before use.
 * This prevents race conditions by making sure the configuration is loaded
 * before any AI flows are called.
 */
async function ensureInitialized() {
  if (!initPromise) {
    initPromise = initialize();
  }
  await initPromise;
}

// We wrap the `ai` object in a proxy to ensure initialization before any access.
// This is a robust way to handle the async nature of initialization.
const aiProxy = new Proxy(
  {},
  {
    get: async (target, prop) => {
      await ensureInitialized();
      return (ai as any)[prop];
    },
  }
) as ReturnType<typeof genkit>;

export {aiProxy as ai};
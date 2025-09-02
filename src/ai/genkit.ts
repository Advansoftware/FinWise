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

let ai: ReturnType<typeof genkit>;
let initPromise: Promise<void> | null = null;

async function initialize() {
  // Evita re-inicialização
  if (ai) return;

  const settings = await getAISettings();
  const plugins: Plugin[] = [];

  if (settings.provider === 'googleai' && settings.googleAIApiKey) {
    plugins.push(googleAI({apiKey: settings.googleAIApiKey}));
  } else if (settings.provider === 'ollama' && settings.ollamaModel) {
    // Apenas configure o Ollama se explicitamente selecionado.
    // Em um ambiente de produção/PWA, isso não funcionará a menos que o servidor tenha acesso.
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
    // Se nenhum provedor estiver configurado, não adicione nenhum plugin.
    // A UI irá guiar o usuário para a página de configurações.
    // Isso evita que a aplicação quebre tentando contatar um localhost inexistente.
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
  return ai;
}

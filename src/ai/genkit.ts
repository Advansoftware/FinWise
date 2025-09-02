/**
 * @fileoverview This file initializes and configures the Genkit AI toolkit instance.
 * It sets up plugins for different AI providers like Ollama and OpenAI.
 */

import { genkit, type Genkit } from 'genkit';
import { ollama } from 'genkitx-ollama';
import { openAI } from 'genkitx-openai';
import { AISettings } from '@/lib/types';
import { googleAI } from '@genkit-ai/googleai';

/**
 * The global Genkit instance.
 * All flows and prompts should be defined on this instance.
 */
export const ai = genkit({
    plugins: [
        // Default Ollama plugin para fallback
        ollama({
            models: [{ name: 'llama3' }],
            serverAddress: 'http://127.0.0.1:11434',
        })
    ]
});

/**
 * Creates appropriate plugins based on AI settings
 */
export function createAIPlugins(settings: AISettings): any[] {
    const plugins: any[] = [];

    switch (settings.provider) {
        case 'ollama':
            if (settings.ollamaModel) {
                plugins.push(
                    ollama({
                        models: [{ name: settings.ollamaModel }],
                        serverAddress: settings.ollamaServerAddress || 'http://127.0.0.1:11434',
                    })
                );
            }
            break;

        case 'googleai':
            if (settings.googleAIApiKey) {
                 plugins.push(
                    googleAI({
                        apiKey: settings.googleAIApiKey,
                    })
                );
            }
            break;

        case 'openai':
            if (settings.openAIApiKey && settings.openAIModel) {
                plugins.push(
                    openAI({
                        apiKey: settings.openAIApiKey,
                    })
                );
            }
            break;
    }

    // Fallback to default Ollama if no plugins were created
    if (plugins.length === 0) {
        plugins.push(
            ollama({
                models: [{ name: 'llama3' }],
                serverAddress: 'http://127.0.0.1:11434',
            })
        );
    }

    return plugins;
}

/**
 * Gets the model reference based on settings
 */
export function getModelReference(settings: AISettings): string {
    switch (settings.provider) {
        case 'ollama':
            return `ollama/${settings.ollamaModel || 'llama3'}`;
         case 'googleai':
            // Não precisa de um modelo específico, o Gemini Pro é usado por padrão
            return `googleai/gemini-1.5-flash-latest`;
        case 'openai':
            return `openai/${settings.openAIModel || 'gpt-3.5-turbo'}`;
        default:
            return 'ollama/llama3'; // fallback
    }
}

/**
 * Creates a configured Genkit instance with the specified settings
 */
export function createConfiguredAI(settings: AISettings): Genkit {
    const plugins = createAIPlugins(settings);
    return genkit({ plugins });
}

/**
 * Validates AI settings
 */
export function validateAISettings(settings: AISettings): boolean {
    switch (settings.provider) {
        case 'ollama':
            return !!settings.ollamaModel;
        case 'googleai':
            return !!settings.googleAIApiKey;
        case 'openai':
            return !!(settings.openAIApiKey && settings.openAIModel);
        default:
            return false;
    }
}

/**
 * Gets model configuration string for display/logging
 */
export function getModelConfigString(settings: AISettings): string {
    switch (settings.provider) {
        case 'ollama':
            return `Ollama (${settings.ollamaModel}) @ ${settings.ollamaServerAddress}`;
        case 'googleai':
            return `Google AI (Gemini)`;
        case 'openai':
            return `OpenAI (${settings.openAIModel})`;
        default:
            return 'Unknown provider';
    }
}

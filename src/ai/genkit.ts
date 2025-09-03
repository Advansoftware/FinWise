/**
 * @fileoverview This file initializes and configures the Genkit AI toolkit instance.
 * It sets up plugins for different AI providers like Ollama and OpenAI.
 */

import { genkit, type Genkit } from 'genkit';
import { ollama } from 'genkitx-ollama';
import { openAI } from 'genkitx-openai';
import { AICredential } from '@/lib/types';
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
export function createAIPlugins(credential: AICredential): any[] {
    const plugins: any[] = [];

    switch (credential.provider) {
        case 'finwise':
        case 'googleai':
            if (process.env.GEMINI_API_KEY) {
                 plugins.push(
                    googleAI({
                        apiKey: process.env.GEMINI_API_KEY,
                    })
                );
            }
            break;
        case 'ollama':
            if (credential.ollamaModel) {
                plugins.push(
                    ollama({
                        models: [{ name: credential.ollamaModel }],
                        serverAddress: credential.ollamaServerAddress || 'http://127.0.0.1:11434',
                    })
                );
            }
            break;
        case 'openai':
            if (credential.openAIApiKey && credential.openAIModel) {
                plugins.push(
                    openAI({
                        apiKey: credential.openAIApiKey,
                    })
                );
            }
            break;
    }

    // Fallback to default Ollama if no plugins were created (e.g., missing API key)
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
export function getModelReference(credential: AICredential): string {
    switch (credential.provider) {
        case 'ollama':
            return `ollama/${credential.ollamaModel || 'llama3'}`;
         case 'finwise':
         case 'googleai':
            return `googleai/gemini-1.5-flash-latest`;
        case 'openai':
            return `openai/${credential.openAIModel || 'gpt-3.5-turbo'}`;
        default:
            return 'ollama/llama3'; // fallback
    }
}

/**
 * Creates a configured Genkit instance with the specified settings
 */
export function createConfiguredAI(credential: AICredential): Genkit {
    const plugins = createAIPlugins(credential);
    return genkit({ plugins });
}

/**
 * Validates AI settings
 */
export function validateAISettings(credential: AICredential): boolean {
    switch (credential.provider) {
        case 'finwise':
            return !!process.env.GEMINI_API_KEY;
        case 'ollama':
            return !!credential.ollamaModel;
        case 'googleai':
            return !!credential.googleAIApiKey;
        case 'openai':
            return !!(credential.openAIApiKey && credential.openAIModel);
        default:
            return false;
    }
}

/**
 * Gets model configuration string for display/logging
 */
export function getModelConfigString(credential: AICredential): string {
    switch (credential.provider) {
        case 'finwise':
            return `FinWise AI (Otimizado)`;
        case 'ollama':
            return `Ollama (${credential.ollamaModel}) @ ${credential.ollamaServerAddress}`;
        case 'googleai':
            return `Google AI (Gemini)`;
        case 'openai':
            return `OpenAI (${credential.openAIModel})`;
        default:
            return 'Unknown provider';
    }
}

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
        case 'gastometria': // This case is now handled by the server-side settings service
            // The resolved credential will have the actual provider (googleai, openai, etc.)
            // We handle the specific provider keys below.
             if (process.env.GEMINI_API_KEY) {
                 plugins.push(googleAI({ apiKey: process.env.GEMINI_API_KEY }));
             }
             if (process.env.OPENAI_API_KEY) {
                 plugins.push(openAI({ apiKey: process.env.OPENAI_API_KEY }));
             }
            break;
        case 'googleai':
            if (credential.googleAIApiKey || process.env.GEMINI_API_KEY) {
                 plugins.push(
                    googleAI({
                        apiKey: credential.googleAIApiKey || process.env.GEMINI_API_KEY,
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
            if (credential.openAIApiKey || process.env.OPENAI_API_KEY) {
                plugins.push(
                    openAI({
                        apiKey: credential.openAIApiKey || process.env.OPENAI_API_KEY,
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
         case 'gastometria':
            // The actual provider is resolved on the server, but we need a client-side hint.
            // The createAIPlugins function will load the correct plugin based on env vars.
            // The model name will also be determined by the default provider env vars.
            if (process.env.DEFAULT_AI_PROVIDER === 'openai') {
                return `openai/${process.env.DEFAULT_OPENAI_MODEL || 'gpt-4o'}`;
            }
            return `googleai/gemini-1.5-flash-latest`;
         case 'googleai':
            return `googleai/gemini-1.5-flash-latest`;
        case 'openai':
            return `openai/${credential.openAIModel || 'gpt-4o'}`;
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
        case 'gastometria':
            // Check if ANY of the default provider keys are set
            return !!process.env.GEMINI_API_KEY || !!process.env.OPENAI_API_KEY;
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
        case 'gastometria':
            return `Gastometria AI (Otimizado)`;
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

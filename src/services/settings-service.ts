// src/services/settings-service.ts
'use server';

import {AICredential, OpenAIModel} from '@/lib/types';
import {getDatabaseAdapter} from '@/core/services/service-factory';

const GASTOMETRIA_AI_CREDENTIAL_ID = 'gastometria-ai-default';

const gastometriaAICredential: AICredential = {
  id: GASTOMETRIA_AI_CREDENTIAL_ID,
  name: 'Gastometria AI',
  provider: 'gastometria',
  isReadOnly: true,
};

const DEFAULT_AI_FALLBACK_CREDENTIAL: AICredential = {
  id: 'default-fallback',
  name: 'Default Fallback Ollama',
  provider: 'ollama',
  ollamaModel: 'llama3',
  ollamaServerAddress: 'http://127.0.0.1:11434',
};

function getDefaultAICredentialFromEnv(): AICredential {
  const provider = process.env.DEFAULT_AI_PROVIDER || 'googleai';

  switch (provider) {
    case 'openai':
      return {
        ...gastometriaAICredential,
        provider: 'openai',
        openAIModel: (process.env.DEFAULT_OPENAI_MODEL || 'gpt-4o') as OpenAIModel,
        openAIApiKey: process.env.OPENAI_API_KEY
      };
    case 'ollama':
      return {
        ...gastometriaAICredential,
        provider: 'ollama',
        ollamaModel: process.env.DEFAULT_OLLAMA_MODEL || 'llama3',
        ollamaServerAddress: process.env.DEFAULT_OLLAMA_URL || 'http://127.0.0.1:11434',
      };
    case 'googleai':
    default:
      return {
        ...gastometriaAICredential,
        provider: 'googleai',
        googleAIApiKey: process.env.GEMINI_API_KEY,
      };
  }
}

export async function getActiveAICredential(userId: string): Promise<AICredential> {
  if (!userId) {
    console.warn("getActiveAICredential called without a userId. Returning default settings.");
    return getDefaultAICredentialFromEnv();
  }

  try {
    const db = await getDatabaseAdapter();
    const settings = await db.settings.findByUserId(userId);
    const aiSettings = settings?.ai_settings;

    if (aiSettings && aiSettings.activeCredentialId && aiSettings.credentials) {
      if (aiSettings.activeCredentialId === GASTOMETRIA_AI_CREDENTIAL_ID) {
        return getDefaultAICredentialFromEnv();
      }

      const activeCredential = aiSettings.credentials.find(
        (c: AICredential) => c.id === aiSettings.activeCredentialId
      );

      if (activeCredential) {
        return { ...DEFAULT_AI_FALLBACK_CREDENTIAL, ...activeCredential };
      }
    }

    return getDefaultAICredentialFromEnv();
  } catch (error) {
    console.error("Error getting AI settings from database:", error);
    return DEFAULT_AI_FALLBACK_CREDENTIAL;
  }
}

export async function getCredentialById(userId: string, credentialId: string): Promise<AICredential> {
  if (!userId || !credentialId) {
    return getDefaultAICredentialFromEnv();
  }

  // Se for a Gastometria IA, retornar a configuração padrão
  if (credentialId === GASTOMETRIA_AI_CREDENTIAL_ID) {
    return getDefaultAICredentialFromEnv();
  }

  try {
    const db = await getDatabaseAdapter();
    const settings = await db.settings.findByUserId(userId);
    const aiSettings = settings?.ai_settings;

    if (aiSettings && aiSettings.credentials) {
      const credential = aiSettings.credentials.find(
        (c: AICredential) => c.id === credentialId
      );

      if (credential) {
        return { ...DEFAULT_AI_FALLBACK_CREDENTIAL, ...credential };
      }
    }

    // Se não encontrou, retornar a credencial ativa
    return await getActiveAICredential(userId);
  } catch (error) {
    console.error("Error getting credential by ID from database:", error);
    return getDefaultAICredentialFromEnv();
  }
}

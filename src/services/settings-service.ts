// src/services/settings-service.ts
'use server';

import { AICredential } from '@/lib/types';
import { getAdminApp } from '@/lib/firebase-admin';

// This service will now act as a server-side reader for settings,
// regardless of the underlying database.
// For now, it's still tied to Firebase Admin SDK because that's our trusted server environment.
// A more advanced setup would have this service use an admin-level adapter.

const FINWISE_AI_CREDENTIAL_ID = 'finwise-ai-default';

const finwiseAICredential = {
    id: FINWISE_AI_CREDENTIAL_ID,
    name: 'FinWise AI',
    provider: 'finwise',
    isReadOnly: true,
} as const;

// Default AI settings for fallback ONLY.
const DEFAULT_AI_FALLBACK_CREDENTIAL: AICredential = {
  id: 'default-fallback',
  name: 'Default Fallback Ollama',
  provider: 'ollama',
  ollamaModel: 'llama3',
  ollamaServerAddress: 'http://127.0.0.1:11434',
};

/**
 * Constructs the default AI credential based on environment variables.
 * This allows the default "FinWise AI" to be powered by any supported provider.
 */
function getDefaultAICredentialFromEnv(): AICredential {
    const provider = process.env.DEFAULT_AI_PROVIDER || 'googleai';

    switch (provider) {
        case 'openai':
            return {
                ...finwiseAICredential,
                provider: 'openai',
                openAIModel: process.env.DEFAULT_OPENAI_MODEL || 'gpt-4o',
                openAIApiKey: process.env.OPENAI_API_KEY
            };
        case 'ollama':
            return {
                ...finwiseAICredential,
                provider: 'ollama',
                ollamaModel: process.env.DEFAULT_OLLAMA_MODEL || 'llama3',
                ollamaServerAddress: process.env.DEFAULT_OLLAMA_URL || 'http://127.0.0.1:11434',
            };
        case 'googleai':
        default:
             return {
                ...finwiseAICredential,
                provider: 'googleai',
                googleAIApiKey: process.env.GEMINI_API_KEY,
            };
    }
}


// Server action to get AI settings using Admin SDK
export async function getActiveAICredential(userId: string): Promise<AICredential> {
  if (!userId) {
    console.warn("getActiveAICredential called without a userId. Returning default settings.");
    return getDefaultAICredentialFromEnv();
  }

  try {
    const adminDb = getAdminApp().firestore();
    const settingsRef = adminDb.doc(`users/${userId}/settings/ai`);
    const docSnap = await settingsRef.get();

    if (docSnap.exists()) {
      const settings = docSnap.data();
      if (settings && settings.activeCredentialId && settings.credentials) {
        // If the active credential is the default FinWise AI, construct it from env
        if (settings.activeCredentialId === FINWISE_AI_CREDENTIAL_ID) {
          return getDefaultAICredentialFromEnv();
        }
        
        // Otherwise, find the user-defined credential
        const activeCredential = settings.credentials.find((c: AICredential) => c.id === settings.activeCredentialId);
        if (activeCredential) {
          // Merge with fallback to ensure all fields are present
          return { ...DEFAULT_AI_FALLBACK_CREDENTIAL, ...activeCredential };
        }
      }
    }
    
    // If no specific setting is found, default to FinWise AI constructed from env
    return getDefaultAICredentialFromEnv();
    
  } catch (error) {
    console.error("Error getting AI settings from Firestore with Admin SDK:", error);
    // In case of error (e.g., permissions), return defaults to avoid breaking the app
    return DEFAULT_AI_FALLBACK_CREDENTIAL;
  }
}

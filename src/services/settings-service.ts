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
const DEFAULT_AI_CREDENTIAL: AICredential = {
  id: 'default-fallback',
  name: 'Default Fallback Ollama',
  provider: 'ollama',
  ollamaModel: 'llama3',
  ollamaServerAddress: 'http://127.0.0.1:11434',
};

// Server action to get AI settings using Admin SDK
export async function getActiveAICredential(userId: string): Promise<AICredential> {
  if (!userId) {
    console.warn("getActiveAICredential called without a userId. Returning default settings.");
    return DEFAULT_AI_CREDENTIAL;
  }

  try {
    const adminDb = getAdminApp().firestore();
    const settingsRef = adminDb.doc(`users/${userId}/settings/ai`);
    const docSnap = await settingsRef.get();

    if (docSnap.exists()) {
      const settings = docSnap.data();
      if (settings && settings.activeCredentialId && settings.credentials) {
        if (settings.activeCredentialId === FINWISE_AI_CREDENTIAL_ID) {
          return {
            ...finwiseAICredential,
            provider: 'googleai', // The underlying provider for FinWise AI
            googleAIApiKey: process.env.GEMINI_API_KEY,
          };
        }
        
        const activeCredential = settings.credentials.find((c: AICredential) => c.id === settings.activeCredentialId);
        if (activeCredential) {
          return { ...DEFAULT_AI_CREDENTIAL, ...activeCredential };
        }
      }
    }
    
    // If no specific setting is found, default to FinWise AI
    return {
      ...finwiseAICredential,
      provider: 'googleai',
      googleAIApiKey: process.env.GEMINI_API_KEY,
    };
    
  } catch (error) {
    console.error("Error getting AI settings from Firestore with Admin SDK:", error);
    // In case of error (e.g., permissions), return defaults to avoid breaking the app
    return DEFAULT_AI_CREDENTIAL;
  }
}

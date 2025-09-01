'use server';

import * as admin from 'firebase-admin';

// Garante que a inicialização ocorra apenas uma vez.
if (!admin.apps.length) {
  try {
    // No ambiente do App Hosting, initializeApp() sem argumentos
    // usa automaticamente as credenciais do ambiente.
    admin.initializeApp();
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // Lançar um erro aqui pode ajudar a diagnosticar problemas de inicialização.
    throw new Error('Failed to initialize Firebase Admin SDK.');
  }
}

// Exporta as instâncias de serviço do Admin SDK.
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

'use server';

import * as admin from 'firebase-admin';

// Função para obter a instância inicializada do Firebase Admin.
// Isso evita condições de corrida na inicialização.
function getFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp();
    } catch (error) {
      console.error('Firebase admin initialization error:', error);
      // Lança um erro mais descritivo para facilitar a depuração.
      throw new Error('Failed to initialize Firebase Admin SDK. Check server logs for details.');
    }
  }
  return {
    auth: admin.auth(),
    db: admin.firestore(),
  };
}

// Exporta a função em vez das instâncias diretas.
export { getFirebaseAdmin };

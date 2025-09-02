'use server';

import * as admin from 'firebase-admin';
import { firebaseConfig } from './firebase';

// Armazena a instância inicializada para evitar múltiplas inicializações.
let adminInstance: { auth: admin.auth.Auth, db: admin.firestore.Firestore } | null = null;

// Função para obter a instância inicializada do Firebase Admin.
// Isso evita condições de corrida na inicialização.
function getFirebaseAdmin() {
  if (adminInstance) {
    return adminInstance;
  }

  if (!admin.apps.length) {
    try {
      // Inicializa o SDK Admin com o projectId, que é suficiente para
      // validar tokens de ID na maioria dos ambientes.
      admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    } catch (error) {
      console.error('Firebase admin initialization error:', error);
      // Lança um erro mais descritivo para facilitar a depuração.
      throw new Error('Failed to initialize Firebase Admin SDK. Check server logs for details.');
    }
  }

  adminInstance = {
    auth: admin.auth(),
    db: admin.firestore(),
  };

  return adminInstance;
}

// Exporta a função em vez das instâncias diretas.
export { getFirebaseAdmin };

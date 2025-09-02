
'use server';

import * as admin from 'firebase-admin';
import { firebaseConfig } from './firebase';

// Armazena a instância inicializada para evitar múltiplas inicializações.
let adminInstance: admin.app.App | null = null;

// Função para obter a instância inicializada do Firebase Admin.
// Isso evita condições de corrida na inicialização.
function getFirebaseAdminApp(): admin.app.App {
  if (adminInstance) {
    return adminInstance;
  }

  if (admin.apps.length > 0) {
    adminInstance = admin.app();
    return adminInstance;
  }
  
  try {
    // Inicializa o Admin SDK com a configuração do projeto,
    // que é suficiente para o nosso ambiente de desenvolvimento.
    adminInstance = admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // Lança um erro mais descritivo para facilitar a depuração.
    throw new Error('Failed to initialize Firebase Admin SDK. Check server logs for details.');
  }

  return adminInstance;
}

// Exporta a função em vez das instâncias diretas.
export { getFirebaseAdminApp };

'use server';

import * as admin from 'firebase-admin';

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
      // Tenta usar as credenciais do ambiente, que é a forma padrão e segura.
      // Isso funciona automaticamente no Firebase/Google Cloud.
      // Para desenvolvimento local, requer o setup do GOOGLE_APPLICATION_CREDENTIALS.
      admin.initializeApp();
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

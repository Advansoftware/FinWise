
'use server';

import * as admin from 'firebase-admin';

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
    // A configuração é buscada automaticamente pelas variáveis de ambiente
    // padrão do Firebase (FIREBASE_CONFIG) quando em um ambiente de servidor do Google.
    // Para desenvolvimento local, você deve configurar as credenciais via
    // GOOGLE_APPLICATION_CREDENTIALS.
    adminInstance = admin.initializeApp();
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // Lança um erro mais descritivo para facilitar a depuração.
    throw new Error('Failed to initialize Firebase Admin SDK. Check server logs or GOOGLE_APPLICATION_CREDENTIALS environment variable for details.');
  }

  return adminInstance;
}

// Exporta a função em vez das instâncias diretas.
export { getFirebaseAdminApp };

    
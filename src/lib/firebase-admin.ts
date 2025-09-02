
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

  // Se já houver uma instância, use-a.
  if (admin.apps.length > 0) {
    adminInstance = admin.app();
    return adminInstance;
  }
  
  try {
    // Inicializa o Admin SDK sem credenciais explícitas.
    // O SDK encontrará as credenciais do ambiente automaticamente.
    adminInstance = admin.initializeApp();
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // Lança um erro mais descritivo para facilitar a depuração.
    throw new Error('Failed to initialize Firebase Admin SDK. Check server logs for details.');
  }

  return adminInstance;
}

// Exporta a função em vez das instâncias diretas.
export { getFirebaseAdminApp };

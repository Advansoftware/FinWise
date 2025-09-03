
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

/**
 * Initializes and returns the Firebase Admin App instance.
 * Uses GOOGLE_APPLICATION_CREDENTIALS environment variable for authentication.
 */
export function getAdminApp(): admin.app.App {
  if (adminApp) {
    return adminApp;
  }

  if (admin.apps.length > 0) {
    adminApp = admin.app();
    return adminApp;
  }

  try {
    // Verificar se a variável de ambiente está definida
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS não está definida no ambiente.');
    }

    // O Firebase Admin SDK automaticamente usa GOOGLE_APPLICATION_CREDENTIALS
    // quando nenhuma credencial é especificada explicitamente
    adminApp = admin.initializeApp({
      // Opcionalmente, você pode especificar o projectId explicitamente
      // projectId: 'finwise-dashboard-3qmzc'
    });

    console.log('Firebase Admin SDK inicializado com sucesso usando GOOGLE_APPLICATION_CREDENTIALS.');

  } catch (error: any) {
    console.error('Falha ao inicializar o Firebase Admin SDK.', error);

    if (error.code === 'app/invalid-credential') {
      console.error("Erro de credenciais inválidas. Soluções possíveis:");
      console.error("1. Verifique se GOOGLE_APPLICATION_CREDENTIALS aponta para um arquivo JSON válido");
      console.error("2. Baixe um novo arquivo de credenciais do Firebase Console");
      console.error("3. Certifique-se de que o arquivo existe no caminho especificado");
    }

    throw new Error(`Não foi possível inicializar o Firebase Admin: ${error.message}`);
  }

  return adminApp;
}

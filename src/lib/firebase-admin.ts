
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

/**
 * Initializes and returns the Firebase Admin App instance.
 * It relies on the GOOGLE_APPLICATION_CREDENTIALS environment variable
 * being set to the path of the service account key file.
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
    // This is the standard way to initialize. It automatically uses
    // the GOOGLE_APPLICATION_CREDENTIALS environment variable if it's set.
    adminApp = admin.initializeApp();
  } catch(error: any) {
    console.error("Falha ao inicializar o Firebase Admin SDK.", error);
    console.error("Verifique se a variável de ambiente GOOGLE_APPLICATION_CREDENTIALS está apontando para um arquivo de credenciais válido.");
    throw new Error("Não foi possível inicializar o Firebase Admin. Consulte os logs do servidor.");
  }

  return adminApp;
}

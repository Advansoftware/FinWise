
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import serviceAccountCredentials from '../../firebase-credentials.json';

let adminApp: admin.app.App;

/**
 * Initializes and returns the Firebase Admin App instance.
 * It imports the credentials directly from the JSON file and
 * correctly formats the private key to avoid parsing errors.
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
    // Type assertion to treat the imported JSON as a ServiceAccount object
    const serviceAccount = serviceAccountCredentials as admin.ServiceAccount;

    // **CRUCIAL FIX**: Replace literal '\\n' with actual newlines
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
  } catch(error: any) {
    console.error("Falha ao inicializar o Firebase Admin SDK.", error);
    if (error.code === 'app/invalid-credential') {
        console.error("O erro 'app/invalid-credential' geralmente ocorre devido a uma formatação incorreta da chave privada no arquivo de credenciais.");
        console.error("Verifique se a 'private_key' no seu firebase-credentials.json está correta.");
    }
    throw new Error("Não foi possível inicializar o Firebase Admin. Consulte os logs do servidor.");
  }

  return adminApp;
}

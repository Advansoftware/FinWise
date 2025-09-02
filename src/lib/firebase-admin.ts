
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let adminApp: admin.app.App;

/**
 * Initializes and returns the Firebase Admin App instance.
 * It handles reading credentials from a file specified by GOOGLE_APPLICATION_CREDENTIALS
 * and correctly formats the private key to avoid parsing errors.
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
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (credPath) {
      const absolutePath = path.resolve(process.cwd(), credPath);
      if (fs.existsSync(absolutePath)) {
        const serviceAccountString = fs.readFileSync(absolutePath, 'utf8');
        const serviceAccount = JSON.parse(serviceAccountString);

        // **CRUCIAL FIX**: Replace literal '\\n' with actual newlines
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        adminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        return adminApp;
      }
    }
    
    // Fallback to default initialization if the file doesn't exist or path not set
    // This might work in environments like Google Cloud Run where credentials are auto-injected
    adminApp = admin.initializeApp();

  } catch(error: any) {
    console.error("Falha ao inicializar o Firebase Admin SDK.", error);
    console.error("Verifique se a variável de ambiente GOOGLE_APPLICATION_CREDENTIALS está apontando para um arquivo de credenciais válido e se o arquivo existe.");
    throw new Error("Não foi possível inicializar o Firebase Admin. Consulte os logs do servidor.");
  }

  return adminApp;
}

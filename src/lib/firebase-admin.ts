
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
    // When running in a Google Cloud environment, the SDK can auto-discover credentials.
    // For local development, GOOGLE_APPLICATION_CREDENTIALS points to the service account JSON file.
    const credential = process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? admin.credential.applicationDefault()
      : undefined;

    if (!credential) {
        console.warn("Firebase Admin SDK: GOOGLE_APPLICATION_CREDENTIALS não está definida. Algumas funcionalidades do servidor podem não funcionar. Usado para webhooks do Stripe, por exemplo.");
         // Create a dummy app to avoid crashing the server, but it won't be authenticated
         adminApp = admin.initializeApp({
             projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
         });
         return adminApp;
    }

    adminApp = admin.initializeApp({
      credential,
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
    });

    console.log('Firebase Admin SDK inicializado com sucesso.');

  } catch (error: any) {
    console.error('Falha ao inicializar o Firebase Admin SDK.', error);
    throw new Error(`Não foi possível inicializar o Firebase Admin: ${error.message}`);
  }

  return adminApp;
}

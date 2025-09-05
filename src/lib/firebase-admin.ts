
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
    // Check if we have credentials file
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (credentialsPath) {
      // Try to use the credentials file
      try {
        const credential = admin.credential.applicationDefault();
        adminApp = admin.initializeApp({
          credential,
          databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
        });
        console.log('✅ Firebase Admin SDK inicializado com credenciais.');
        return adminApp;
      } catch (credError: any) {
        console.warn('⚠️ Falha ao carregar credenciais do Firebase:', credError.message);
      }
    }

    // Fallback: Create app without credentials (limited functionality)
    console.warn("⚠️ Firebase Admin SDK: Inicializando sem autenticação. Algumas funcionalidades podem não funcionar.");
    adminApp = admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gastometria-default',
    });

    return adminApp;

  } catch (error: any) {
    console.error('❌ Falha ao inicializar o Firebase Admin SDK.', error);
    // Return a mock app instead of throwing to avoid crashing the server
    adminApp = admin.initializeApp({
      projectId: 'mock-project',
    });
    return adminApp;
  }
}

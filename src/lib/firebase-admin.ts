// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

let adminApp: admin.app.App;

export function getAdminApp(): admin.app.App {
  if (adminApp) {
    return adminApp;
  }
  
  if (!serviceAccount) {
    // This will be caught by Next.js and result in a build error.
    // We log it here for more direct feedback during development.
    console.error('FATAL ERROR: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
  }

  if (admin.apps.length > 0) {
    adminApp = admin.app();
  } else {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  return adminApp;
}

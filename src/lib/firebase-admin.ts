import * as admin from 'firebase-admin';

// Em um ambiente do Firebase App Hosting, as credenciais da conta de serviço
// são injetadas automaticamente no ambiente.
// Chamar initializeApp() sem argumentos fará com que o SDK as encontre.
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (e) {
    console.error('Firebase admin initialization error', e);
  }
}

export const adminApp = admin.apps[0]!;
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

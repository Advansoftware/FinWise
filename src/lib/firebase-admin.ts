'use server';
import * as admin from 'firebase-admin';

// Este é o método mais robusto para inicialização no lado do servidor em ambientes Google.
// O SDK encontrará as credenciais automaticamente sem a necessidade de arquivos .env ou JSON.
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // Lançamos um erro claro para facilitar a depuração, caso as credenciais ainda falhem.
    throw new Error('Failed to initialize Firebase Admin SDK. Check the service account credentials.');
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

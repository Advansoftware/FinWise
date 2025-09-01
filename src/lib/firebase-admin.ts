'use server';

import * as admin from 'firebase-admin';

// Garante que a inicialização ocorra apenas uma vez.
if (!admin.apps.length) {
  admin.initializeApp();
}

// Exporta as instâncias de serviço do Admin SDK.
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

'use server';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    throw new Error('Failed to initialize Firebase Admin SDK. Make sure the service account credentials are set up correctly.');
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

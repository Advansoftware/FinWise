// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// As variáveis de ambiente, incluindo a chave da conta de serviço,
// são injetadas pelo ambiente de hospedagem ou carregadas do .env.local
// durante o desenvolvimento local.
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let adminApp: admin.app.App;

export function getAdminApp(): admin.app.App {
  if (adminApp) {
    return adminApp;
  }
  
  if (!serviceAccountString) {
    console.error('FATAL ERROR: A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não está definida.');
    throw new Error('A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não está definida.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString);

    if (admin.apps.length > 0) {
      adminApp = admin.app();
    } else {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (error: any) {
    console.error('Erro ao fazer parse da chave da conta de serviço ou ao inicializar o Admin App:', error.message);
    throw new Error('Falha ao inicializar o Firebase Admin. Verifique a FIREBASE_SERVICE_ACCOUNT_KEY.');
  }


  return adminApp;
}

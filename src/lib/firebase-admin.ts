
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

export function getAdminApp(): admin.app.App {
  if (adminApp) {
    return adminApp;
  }
  
  if (admin.apps.length > 0) {
    adminApp = admin.app();
    return adminApp;
  }

  // Tenta inicializar usando o conteúdo da variável de ambiente.
  // Isso é mais robusto para desenvolvimento local e ambientes de compilação.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      return adminApp;
    } catch (error: any) {
      console.error("Falha ao fazer parse ou inicializar com FIREBASE_SERVICE_ACCOUNT_JSON.", error);
      throw new Error("A variável FIREBASE_SERVICE_ACCOUNT_JSON parece estar mal formatada. Consulte os logs.");
    }
  }

  // Fallback para o método padrão (usado em ambientes de produção como o Google Cloud)
  try {
    adminApp = admin.initializeApp();
  } catch(error: any) {
    console.error("Falha ao inicializar o Firebase Admin SDK com credenciais padrão.", error);
    console.error("Verifique se as credenciais (FIREBASE_SERVICE_ACCOUNT_JSON ou GOOGLE_APPLICATION_CREDENTIALS) estão configuradas corretamente no seu ambiente.");
    throw new Error("Não foi possível inicializar o Firebase Admin. Consulte os logs do servidor.");
  }

  return adminApp;
}

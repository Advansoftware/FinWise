
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

export function getAdminApp(): admin.app.App {
  if (adminApp) {
    return adminApp;
  }

  // Quando executando no ambiente do Firebase/Google Cloud, o SDK automaticamente
  // usa a variável de ambiente GOOGLE_APPLICATION_CREDENTIALS (que aponta para um arquivo)
  // ou as credenciais padrão do ambiente para se inicializar.
  // Não é necessário ler a variável ou fazer o parse do JSON manualmente.
  
  if (admin.apps.length > 0) {
    adminApp = admin.app();
  } else {
    // A inicialização sem argumentos funciona quando as variáveis de ambiente
    // (GOOGLE_APPLICATION_CREDENTIALS ou outras do gcloud) estão configuradas.
    try {
      adminApp = admin.initializeApp();
    } catch(error: any) {
        console.error("Falha ao inicializar o Firebase Admin SDK.", error);
        console.error("Verifique se as variáveis de ambiente (GOOGLE_APPLICATION_CREDENTIALS) estão configuradas corretamente no seu ambiente de execução.");
        throw new Error("Não foi possível inicializar o Firebase Admin. Consulte os logs do servidor.");
    }
  }

  return adminApp;
}

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

export const firebaseConfig = {
  "projectId": "finwise-dashboard-3qmzc",
  "appId": "1:216465784716:web:e38afa3ea4af0096cae0a9",
  "storageBucket": "finwise-dashboard-3qmzc.firebasestorage.app",
  "apiKey": "AIzaSyB1W3mcMXcCIV58HlKz76U6y6P83F6AQqQ",
  "authDomain": "finwise-dashboard-3qmzc.firebaseapp.com",
  "messagingSenderId": "216465784716"
};

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

function getFirebase(): FirebaseServices {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          console.warn('Falha na pré-condição da persistência. Múltiplas abas abertas?');
        } else if (err.code == 'unimplemented') {
          console.warn('O navegador atual não suporta persistência offline.');
        }
      });
  } catch (error) {
      console.error("Erro ao habilitar persistência: ", error);
  }

  return { app, auth, db };
}

// Export a single function to get initialized services
export { getFirebase };

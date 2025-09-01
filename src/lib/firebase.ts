import { initializeApp, getApps } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  projectId: "finwise-dashboard-3qmzc",
  appId: "1:216465784716:web:e38afa3ea4af0096cae0a9",
  storageBucket: "finwise-dashboard-3qmzc.firebasestorage.app",
  apiKey: "AIzaSyB1W3mcMXcCIV58HlKz76U6y6P83F6AQqQ",
  authDomain: "finwise-dashboard-3qmzc.firebaseapp.com",
  messagingSenderId: "216465784716"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);


// Enable offline persistence
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

export { db, auth };

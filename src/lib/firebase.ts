import { initializeApp, getApps } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, onSnapshot, collection, query, disableNetwork, enableNetwork } from "firebase/firestore";

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

// Enable offline persistence
try {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log('Persistência offline habilitada.');
      // Forçar a sincronização inicial
      const unsub = onSnapshot(query(collection(db, 'transactions')), () => {
        console.log('Sincronização inicial completa.');
        unsub(); 
      });
    })
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

// Funções para controle manual da rede (opcional)
const forceOffline = () => disableNetwork(db);
const forceOnline = () => enableNetwork(db);


export { db, forceOffline, forceOnline };

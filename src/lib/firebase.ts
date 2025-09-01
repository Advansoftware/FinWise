import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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

export { db };

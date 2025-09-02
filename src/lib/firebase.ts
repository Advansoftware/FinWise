
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

let firebaseServices: FirebaseServices | null = null;

// This function initializes Firebase for a CLIENT environment.
function getFirebase(): FirebaseServices {
  if (firebaseServices) {
    return firebaseServices;
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    // This enables offline persistence. It must be called before any other Firestore operations.
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Firestore persistence failed-precondition. Multiple tabs open?');
      } else if (err.code == 'unimplemented') {
        console.warn('Firestore persistence is not available in this browser.');
      }
    });
  } catch (error) {
    console.error("Error enabling Firestore persistence: ", error);
  }

  firebaseServices = { app, auth, db };
  return firebaseServices;
}

// Export a single function to get initialized services
export { getFirebase };

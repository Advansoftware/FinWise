
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { firebaseConfig } from "./firebase";

interface FirebaseServerServices {
  app: FirebaseApp;
  db: Firestore;
}

let firebaseServerServices: FirebaseServerServices | null = null;

// This function initializes Firebase for a SERVER environment.
// It's crucial that this is only imported and used in 'use server' files (like actions).
function getFirebase(): FirebaseServerServices {
  if (firebaseServerServices) {
    return firebaseServerServices;
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const db = getFirestore(app);

  firebaseServerServices = { app, db };
  return firebaseServerServices;
}

export { getFirebase };

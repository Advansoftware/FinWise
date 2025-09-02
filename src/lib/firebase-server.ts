
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { firebaseConfig } from "./firebase";
import { credential } from "firebase-admin";

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

  // This is the robust way to initialize for server-side environments like Cloud Functions, App Engine, etc.
  const app = !getApps().length
    ? initializeApp({
        credential: credential.applicationDefault(),
        projectId: firebaseConfig.projectId,
      })
    : getApp();

  const db = getFirestore(app);

  firebaseServerServices = { app, db };
  return firebaseServerServices;
}

export { getFirebase };

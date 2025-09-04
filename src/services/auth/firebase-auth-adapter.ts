// src/services/auth/firebase-auth-adapter.ts

import { getFirebase } from "@/lib/firebase";
import { 
  onIdTokenChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword
} from 'firebase/auth';
import { IAuthAdapter, AuthStateChangedCallback, Unsubscribe } from "./auth-adapter";
import { UserProfile } from "@/lib/types";
import { getDatabaseAdapter } from "../database/database-service";


export class FirebaseAuthAdapter implements IAuthAdapter {
    private auth;
    private dbAdapter;

    constructor() {
        const { auth } = getFirebase();
        this.auth = auth;
        this.dbAdapter = getDatabaseAdapter();
    }

    private async ensureUserProfile(firebaseUser: FirebaseUser): Promise<UserProfile> {
      let profile = await this.dbAdapter.getDoc<UserProfile>(`users/${firebaseUser.uid}`);
      if (!profile) {
        console.log(`Creating user profile for ${firebaseUser.uid}`);
        const newUserProfile: Omit<UserProfile, 'uid'> = {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          plan: 'Básico',
          aiCredits: 0,
          createdAt: new Date().toISOString(),
        };
        await this.dbAdapter.setDoc(`users/${firebaseUser.uid}`, newUserProfile);
        profile = await this.dbAdapter.getDoc<UserProfile>(`users/${firebaseUser.uid}`);
        if (!profile) throw new Error("Could not retrieve newly created user profile.");
      }
      return profile;
    }

    async login(email: string, pass: string): Promise<UserProfile> {
        const userCredential = await signInWithEmailAndPassword(this.auth, email, pass);
        return this.ensureUserProfile(userCredential.user);
    }

    async signup(email: string, pass: string, name: string): Promise<UserProfile> {
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, pass);
        await updateProfile(userCredential.user, { displayName: name });
        return this.ensureUserProfile(userCredential.user);
    }

    async logout(): Promise<void> {
        await signOut(this.auth);
    }

    onAuthStateChanged(callback: AuthStateChangedCallback): Unsubscribe {
        return onIdTokenChanged(this.auth, callback);
    }
    
    async signInWithGoogle(): Promise<UserProfile> {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(this.auth, provider);
        return this.ensureUserProfile(result.user);
    }

    async sendPasswordReset(email: string): Promise<void> {
        await sendPasswordResetEmail(this.auth, email);
    }

    async reauthenticate(password: string): Promise<void> {
        if (!this.auth.currentUser || !this.auth.currentUser.email) {
            throw new Error("User not authenticated or email is missing");
        }
        const credential = EmailAuthProvider.credential(this.auth.currentUser.email, password);
        await reauthenticateWithCredential(this.auth.currentUser, credential);
    }
    
    async updateUserPassword(newPassword: string): Promise<void> {
        if (!this.auth.currentUser) {
            throw new Error("User not authenticated");
        }
        await updatePassword(this.auth.currentUser, newPassword);
    }

    async getToken(): Promise<string | null> {
        if (!this.auth.currentUser) {
            return null;
        }
        return await this.auth.currentUser.getIdToken();
    }
}

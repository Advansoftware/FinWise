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

    async login(email: string, pass: string): Promise<UserProfile> {
        const userCredential = await signInWithEmailAndPassword(this.auth, email, pass);
        const profile = await this.dbAdapter.getDoc<UserProfile>(`users/${userCredential.user.uid}`);
        if (!profile) throw new Error("User profile not found after login.");
        return profile;
    }

    async signup(email: string, pass: string, name: string): Promise<UserProfile> {
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, pass);
        await updateProfile(userCredential.user, { displayName: name });
        
        const newUserProfile: Omit<UserProfile, 'uid'|'id'> = {
          email: userCredential.user.email,
          displayName: name,
          plan: 'Básico',
          aiCredits: 0,
          createdAt: new Date().toISOString(),
        };

        await this.dbAdapter.setDoc(`users/${userCredential.user.uid}`, newUserProfile);

        const createdProfile = await this.dbAdapter.getDoc<UserProfile>(`users/${userCredential.user.uid}`);
        if (!createdProfile) throw new Error("Failed to create user profile.");

        return createdProfile;
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
        // The onAuthStateChanged handler in use-auth.tsx will handle profile creation/retrieval
        return {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            plan: 'Básico', // Default plan
            aiCredits: 0,
            createdAt: result.user.metadata.creationTime || new Date().toISOString(),
        };
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

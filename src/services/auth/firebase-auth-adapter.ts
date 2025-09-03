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
        if (!profile) throw new Error("User profile not found in database.");
        return profile;
    }

    async signup(email: string, pass: string, name: string): Promise<UserProfile> {
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, pass);
        await updateProfile(userCredential.user, { displayName: name });
        await this.dbAdapter.ensureUserProfile(userCredential.user);
        const profile = await this.dbAdapter.getDoc<UserProfile>(`users/${userCredential.user.uid}`);
        if (!profile) throw new Error("Failed to create user profile in database.");
        return profile;
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
        await this.dbAdapter.ensureUserProfile(result.user);
        const profile = await this.dbAdapter.getDoc<UserProfile>(`users/${result.user.uid}`);
        if (!profile) throw new Error("User profile not found after Google Sign-In.");
        return profile;
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
}

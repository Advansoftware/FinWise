
// src/services/auth/mongodb-auth-adapter.ts

import { getFirebase } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { IAuthAdapter, AuthStateChangedCallback, Unsubscribe } from "./auth-adapter";
import { UserProfile } from "@/lib/types";
import { getDatabaseAdapter } from "../database/database-service";

const SESSION_KEY = 'finwise_session';

export class MongoDbAuthAdapter implements IAuthAdapter {
    private firebaseAuth; // Still needed for Google Sign-In

    constructor() {
        const { auth } = getFirebase();
        this.firebaseAuth = auth;
    }

    async login(email: string, pass: string): Promise<UserProfile> {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Login failed");
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
        return data.user;
    }

    async signup(email: string, pass: string, name: string): Promise<UserProfile> {
         const response = await fetch('/api/users/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass, displayName: name }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Signup failed");
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
        return data.user;
    }

    async logout(): Promise<void> {
        localStorage.removeItem(SESSION_KEY);
        // Also sign out from Firebase in case of a Google session
        if (this.firebaseAuth.currentUser) {
            await this.firebaseAuth.signOut();
        }
        await Promise.resolve();
    }
    
    onAuthStateChanged(callback: AuthStateChangedCallback): Unsubscribe {
        // This method is primarily for the Firebase adapter.
        // The logic for MongoDB is handled directly in the AuthProvider's useEffect.
        // However, we still need to listen for Google Sign-in which uses Firebase.
        const unsubscribeFirebase = this.firebaseAuth.onIdTokenChanged(callback);

        return () => {
            unsubscribeFirebase();
        };
    }

    async signInWithGoogle(): Promise<UserProfile> {
        const dbAdapter = getDatabaseAdapter();
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(this.firebaseAuth, provider);
        await dbAdapter.ensureUserProfile(result.user);
        const profile = await dbAdapter.getDoc<UserProfile>(`users/${result.user.uid}`);
        if (!profile) throw new Error("User profile not found after Google Sign-In.");
        // Since this is a Firebase user, we don't store it in our custom session.
        // The onAuthStateChanged listener will handle it.
        return profile;
    }
    
    // Password reset for custom auth would require a more complex setup with tokens.
    // For now, we'll indicate it's not implemented for this adapter.
    async sendPasswordReset(email: string): Promise<void> {
        // You would need an API endpoint for this.
        // e.g., POST /api/users/request-password-reset
        console.warn("Password reset is not implemented for the MongoDB adapter yet.");
        throw new Error("Password reset is not available for this authentication method.");
    }
    
    async reauthenticate(password: string): Promise<void> {
        console.warn("Reauthentication is not implemented for the MongoDB adapter.");
        throw new Error("Reauthentication is not available for this method.");
    }

    async updateUserPassword(newPassword: string): Promise<void> {
        console.warn("Password update is not implemented for the MongoDB adapter.");
        throw new Error("Password update is not available for this method.");
    }
}

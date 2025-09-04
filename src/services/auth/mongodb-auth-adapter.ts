
// src/services/auth/mongodb-auth-adapter.ts

import { IAuthAdapter, AuthStateChangedCallback, Unsubscribe } from "./auth-adapter";
import { UserProfile } from "@/lib/types";
import { User as FirebaseUser, signInWithCustomToken, signOut } from "firebase/auth";
import { getFirebase } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export class MongoDbAuthAdapter implements IAuthAdapter {
    private auth;

    constructor() {
        // We still need the firebase auth instance to handle session management
        const { auth } = getFirebase();
        this.auth = auth;
    }

    private async exchangeCustomToken(customToken: string): Promise<void> {
        try {
            await signInWithCustomToken(this.auth, customToken);
        } catch (error) {
            console.error("Error signing in with custom token:", error);
            throw new Error("Failed to establish a user session.");
        }
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
        await this.exchangeCustomToken(data.token);
        return data.user;
    }

    async signup(email: string, pass: string, name: string): Promise<UserProfile> {
         const response = await fetch('/api/users/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass, displayName: name }),
        });
        const data = await response.json();
        if (!response.ok && response.status !== 201) {
            throw new Error(data.error || "Signup failed");
        }
        await this.exchangeCustomToken(data.token);
        return data.user;
    }

    async logout(): Promise<void> {
        await signOut(this.auth);
    }
    
    onAuthStateChanged(callback: AuthStateChangedCallback): Unsubscribe {
        return this.auth.onIdTokenChanged(callback);
    }
    
     async signInWithGoogle(): Promise<UserProfile> {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(this.auth, provider);
        // The onAuthStateChanged handler in use-auth.tsx will handle profile creation/retrieval
        // We just need to return a compatible profile shape here for the immediate UI update.
        return {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            plan: 'Básico', // Will be confirmed/created in onAuthStateChanged
            aiCredits: 0,
            createdAt: result.user.metadata.creationTime || new Date().toISOString(),
        };
    }
    
    async sendPasswordReset(email: string): Promise<void> {
        // This would require a custom backend implementation with token generation and a reset page
        console.warn("sendPasswordReset is not implemented for the MongoDB adapter in this example.");
        throw new Error("Password reset is not available for this authentication method yet.");
    }
    
    async reauthenticate(password: string): Promise<void> {
        // This is complex with a custom backend. It would involve a new endpoint
        // to verify the password and maybe issue a short-lived re-auth token.
        console.warn("reauthenticate is not implemented for the MongoDB adapter.");
        throw new Error("Reauthentication is not available for this method.");
    }

    async updateUserPassword(newPassword: string): Promise<void> {
        // This requires a secure backend endpoint to handle password updates.
         console.warn("updateUserPassword is not implemented for the MongoDB adapter.");
        throw new Error("Password update is not available for this method.");
    }

    async getToken(): Promise<string | null> {
        if (!this.auth.currentUser) {
            return null;
        }
        // Force refresh to ensure we get the ID token, not the custom token.
        return await this.auth.currentUser.getIdToken(true);
    }
}

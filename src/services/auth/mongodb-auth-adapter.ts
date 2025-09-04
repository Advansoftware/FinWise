// src/services/auth/mongodb-auth-adapter.ts

import { IAuthAdapter, AuthStateChangedCallback, Unsubscribe } from "./auth-adapter";
import { UserProfile } from "@/lib/types";
import { User as FirebaseUser, signInWithCustomToken } from "firebase/auth";
import { getFirebase } from "@/lib/firebase";

export class MongoDbAuthAdapter implements IAuthAdapter {
    private auth;

    constructor() {
        // We still need the firebase auth instance to exchange the custom token
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
        await this.auth.signOut();
    }
    
    onAuthStateChanged(callback: AuthStateChangedCallback): Unsubscribe {
        return this.auth.onIdTokenChanged(callback);
    }
    
    async signInWithGoogle(): Promise<UserProfile> {
        throw new Error("signInWithGoogle is not supported when AUTH_PROVIDER is mongodb. Use the Firebase provider for this functionality.");
    }
    
    async sendPasswordReset(email: string): Promise<void> {
        throw new Error("Password reset is not available for this authentication method.");
    }
    
    async reauthenticate(password: string): Promise<void> {
        throw new Error("Reauthentication is not available for this method.");
    }

    async updateUserPassword(newPassword: string): Promise<void> {
        throw new Error("Password update is not available for this method.");
    }

    async getToken(): Promise<string | null> {
        if (!this.auth.currentUser) {
            return null;
        }
        return await this.auth.currentUser.getIdToken();
    }
}

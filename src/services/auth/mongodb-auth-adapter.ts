
// src/services/auth/mongodb-auth-adapter.ts

import { IAuthAdapter, AuthStateChangedCallback, Unsubscribe } from "./auth-adapter";
import { UserProfile } from "@/lib/types";
import { User as FirebaseUser, signInWithCustomToken } from "firebase/auth";
import { getFirebase } from "@/lib/firebase";

export class MongoDbAuthAdapter implements IAuthAdapter {
    private auth;
    private broadcastChannel: BroadcastChannel;

    constructor() {
        // We still need the firebase auth instance to exchange the custom token
        const { auth } = getFirebase();
        this.auth = auth;
        this.broadcastChannel = new BroadcastChannel('auth');
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
        localStorage.setItem('user', JSON.stringify(data.user));
        this.broadcastChannel.postMessage({ type: 'LOGIN', payload: data.user });
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
        localStorage.setItem('user', JSON.stringify(data.user));
        this.broadcastChannel.postMessage({ type: 'LOGIN', payload: data.user });
        return data.user;
    }

    async logout(): Promise<void> {
        await this.auth.signOut();
        localStorage.removeItem('user');
        this.broadcastChannel.postMessage({ type: 'LOGOUT' });
    }
    
    onAuthStateChanged(callback: AuthStateChangedCallback): Unsubscribe {
        const handleAuthMessage = (event: MessageEvent) => {
            if (event.data.type === 'LOGIN') {
                callback(event.data.payload as FirebaseUser);
            } else if (event.data.type === 'LOGOUT') {
                callback(null);
            }
        };

        this.broadcastChannel.addEventListener('message', handleAuthMessage);

        // Also check initial state from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                 // The object in localStorage is a UserProfile, not a FirebaseUser.
                 // We need to create a mock FirebaseUser-like object for the callback.
                const userProfile = JSON.parse(storedUser);
                callback(userProfile as FirebaseUser);
            } catch (e) {
                callback(null);
            }
        }

        // We also listen to Firebase's onIdTokenChanged to handle the initial token exchange
        // and session persistence across reloads.
        const firebaseUnsubscribe = this.auth.onIdTokenChanged((firebaseUser) => {
            if (firebaseUser) {
                // This will be called after signInWithCustomToken succeeds
                 callback(firebaseUser);
            } else {
                 callback(null);
            }
        });
        
        return () => {
            this.broadcastChannel.removeEventListener('message', handleAuthMessage);
            firebaseUnsubscribe();
        };
    }
    
    async signInWithGoogle(): Promise<UserProfile> {
        // This should be handled by the FirebaseAuthAdapter
        throw new Error("signInWithGoogle is not supported when AUTH_PROVIDER is mongodb. Use the Firebase provider for this functionality.");
    }
    
    async sendPasswordReset(email: string): Promise<void> {
        // This would require a custom backend implementation
        throw new Error("Password reset is not available for this authentication method.");
    }
    
    async reauthenticate(password: string): Promise<void> {
        // This would require a custom backend implementation
        throw new Error("Reauthentication is not available for this method.");
    }

    async updateUserPassword(newPassword: string): Promise<void> {
        // This would require a custom backend implementation
        throw new Error("Password update is not available for this method.");
    }

    async getToken(): Promise<string | null> {
        if (!this.auth.currentUser) {
            return null;
        }
        return await this.auth.currentUser.getIdToken();
    }
}

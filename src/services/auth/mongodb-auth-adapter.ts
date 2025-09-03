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
        await Promise.resolve();
    }
    
    onAuthStateChanged(callback: AuthStateChangedCallback): Unsubscribe {
        // This adapter doesn't use Firebase's auth state for email/password.
        // We simulate it for Google Sign-In and for initial page load.
        
        // For Google Sign-in, Firebase will handle the auth state.
        const unsubscribeFirebase = this.firebaseAuth.onIdTokenChanged(callback);
        
        // For our custom auth, we check local storage on load.
        try {
            const session = localStorage.getItem(SESSION_KEY);
            if (session) {
                // We need to create a "mock" FirebaseUser object to satisfy the callback type.
                // This is a bit of a hack, but necessary to bridge the two systems.
                const profile: UserProfile = JSON.parse(session);
                const mockUser: FirebaseUser = {
                    uid: profile.uid,
                    email: profile.email,
                    displayName: profile.displayName,
                    // Add other required properties with default values
                    photoURL: null,
                    emailVerified: false,
                    isAnonymous: false,
                    metadata: {},
                    providerData: [],
                    providerId: 'custom',
                    tenantId: null,
                    delete: async () => {},
                    getIdToken: async () => '',
                    getIdTokenResult: async () => ({} as any),
                    reload: async () => {},
                    toJSON: () => ({}),
                };
                callback(mockUser);
            }
        } catch (e) {
            console.error("Failed to parse session", e);
        }

        // Return a function that unsubscribes from the Firebase listener.
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

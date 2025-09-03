// src/services/auth/mongodb-auth-adapter.ts

import { getFirebase } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { IAuthAdapter, AuthStateChangedCallback, Unsubscribe } from "./auth-adapter";
import { UserProfile } from "@/lib/types";
import { getDatabaseAdapter } from "../database/database-service";

const SESSION_KEY = 'finwise_session';
const BROADCAST_CHANNEL_NAME = 'finwise_auth_channel';

export class MongoDbAuthAdapter implements IAuthAdapter {
    private firebaseAuth; // Still needed for Google Sign-In
    private channel: BroadcastChannel;

    constructor() {
        const { auth } = getFirebase();
        this.firebaseAuth = auth;
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    }

    private saveSession(user: UserProfile): void {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        this.channel.postMessage({ type: 'LOGIN', user });
    }

    private clearSession(): void {
        localStorage.removeItem(SESSION_KEY);
        this.channel.postMessage({ type: 'LOGOUT' });
    }

    private getCurrentSession(): FirebaseUser | null {
        try {
            const session = localStorage.getItem(SESSION_KEY);
            if (!session) return null;
            // We need to return an object that looks like a FirebaseUser for the callback
            const userProfile: UserProfile = JSON.parse(session);
            return {
                uid: userProfile.uid,
                email: userProfile.email,
                displayName: userProfile.displayName,
                // Add other required FirebaseUser properties as needed, with dummy values
                providerId: 'password',
                photoURL: null,
                emailVerified: false,
                isAnonymous: false,
                metadata: {},
                providerData: [],
                refreshToken: '',
                tenantId: null,
                delete: async () => {},
                getIdToken: async () => '',
                getIdTokenResult: async () => ({} as any),
                reload: async () => {},
                toJSON: () => ({}),
            } as FirebaseUser;
        } catch (error) {
            return null;
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
        this.saveSession(data.user);
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
        this.saveSession(data.user);
        return data.user;
    }

    async logout(): Promise<void> {
        this.clearSession();
        if (this.firebaseAuth.currentUser) {
            await this.firebaseAuth.signOut();
        }
        await Promise.resolve();
    }
    
    onAuthStateChanged(callback: AuthStateChangedCallback): Unsubscribe {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === SESSION_KEY) {
                callback(this.getCurrentSession());
            }
        };

        const handleBroadcastMessage = (event: MessageEvent) => {
             if (event.data.type === 'LOGIN' || event.data.type === 'LOGOUT') {
                callback(this.getCurrentSession());
            }
        };

        window.addEventListener('storage', handleStorageChange);
        this.channel.addEventListener('message', handleBroadcastMessage);

        // Also check for Google Sign-In state from Firebase
        const unsubscribeFirebase = this.firebaseAuth.onIdTokenChanged((firebaseUser) => {
            if (firebaseUser) {
                // If a Firebase user exists, it takes precedence (e.g., from Google Sign-In)
                callback(firebaseUser);
            } else {
                // Otherwise, check for our custom session
                callback(this.getCurrentSession());
            }
        });
        
        // Initial check
        callback(this.getCurrentSession() || this.firebaseAuth.currentUser);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            this.channel.removeEventListener('message', handleBroadcastMessage);
            unsubscribeFirebase();
        };
    }

    async signInWithGoogle(): Promise<UserProfile> {
        const dbAdapter = getDatabaseAdapter();
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(this.firebaseAuth, provider);
        this.clearSession(); // Clear any custom session
        await dbAdapter.ensureUserProfile(result.user);
        const profile = await dbAdapter.getDoc<UserProfile>(`users/${result.user.uid}`);
        if (!profile) throw new Error("User profile not found after Google Sign-In.");
        return profile;
    }
    
    async sendPasswordReset(email: string): Promise<void> {
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

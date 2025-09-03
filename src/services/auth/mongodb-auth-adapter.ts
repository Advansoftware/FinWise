// src/services/auth/mongodb-auth-adapter.ts

import { getFirebase } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { IAuthAdapter, AuthStateChangedCallback, Unsubscribe } from "./auth-adapter";
import { UserProfile } from "@/lib/types";
import { getDatabaseAdapter } from "../database/database-service";

const SESSION_KEY = 'finwise_session';
const BROADCAST_CHANNEL_NAME = 'finwise_auth_channel';

// Represents the structure stored in localStorage
interface SessionData {
    user: UserProfile;
    token: string; 
}

export class MongoDbAuthAdapter implements IAuthAdapter {
    private firebaseAuth; // Still needed for Google Sign-In
    private channel: BroadcastChannel | null = null;
    private dbAdapter;

    constructor() {
        const { auth } = getFirebase();
        this.firebaseAuth = auth;
        this.dbAdapter = getDatabaseAdapter();
        if (typeof window !== 'undefined') {
            this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        }
    }

    private saveSession(data: SessionData): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(SESSION_KEY, JSON.stringify(data));
        this.channel?.postMessage({ type: 'LOGIN', user: this.mapProfileToFirebaseUser(data.user) });
    }

    private clearSession(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(SESSION_KEY);
        this.channel?.postMessage({ type: 'LOGOUT' });
    }

    private getCurrentSession(): SessionData | null {
        if (typeof window === 'undefined') return null;
        const session = localStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    }
    
    private mapProfileToFirebaseUser(profile: UserProfile): FirebaseUser {
       return {
            uid: profile.uid,
            email: profile.email,
            displayName: profile.displayName,
            providerId: 'password',
            photoURL: null,
            emailVerified: true, // Assume verified for simplicity with custom auth
            isAnonymous: false,
            metadata: {},
            providerData: [],
            refreshToken: '',
            tenantId: null,
            delete: async () => {},
            getIdToken: async () => this.getToken() || '',
            getIdTokenResult: async () => ({} as any),
            reload: async () => {},
            toJSON: () => ({}),
        } as FirebaseUser;
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
        this.saveSession(data); // API now returns { user, token }
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
        this.saveSession(data); // API now returns { user, token }
        return data.user;
    }

    async logout(): Promise<void> {
        this.clearSession();
        if (this.firebaseAuth.currentUser) {
            await this.firebaseAuth.signOut();
        }
    }
    
    onAuthStateChanged(callback: AuthStateChangedCallback): Unsubscribe {
        if (typeof window === 'undefined') {
            return () => {}; // No-op on the server
        }

        const handleStorageAndBroadcast = () => {
            const session = this.getCurrentSession();
            callback(session ? this.mapProfileToFirebaseUser(session.user) : null);
        };

        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'LOGIN' || event.data.type === 'LOGOUT') {
                handleStorageAndBroadcast();
            }
        };

        window.addEventListener('storage', handleStorageAndBroadcast);
        this.channel?.addEventListener('message', handleMessage);
        
        // Also check for Google Sign-In state from Firebase
        const unsubscribeFirebase = this.firebaseAuth.onIdTokenChanged((firebaseUser) => {
            if (firebaseUser) {
                // If a Firebase user exists, it takes precedence (e.g., from Google Sign-In)
                this.clearSession(); // Clear custom session if Google Sign-In is used
                callback(firebaseUser);
            } else {
                // Otherwise, check for our custom session
                handleStorageAndBroadcast();
            }
        });

        // Initial check
        handleStorageAndBroadcast();

        return () => {
            window.removeEventListener('storage', handleStorageAndBroadcast);
            this.channel?.removeEventListener('message', handleMessage);
            unsubscribeFirebase();
        };
    }

    async signInWithGoogle(): Promise<UserProfile> {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(this.firebaseAuth, provider);
        this.clearSession(); // Clear any custom session
        await this.dbAdapter.ensureUserProfile(result.user);
        const profile = await this.dbAdapter.getDoc<UserProfile>(`users/${result.user.uid}`);
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

    async getToken(): Promise<string | null> {
        // If there's a firebase user, get their token
        if (this.firebaseAuth.currentUser) {
            return this.firebaseAuth.currentUser.getIdToken();
        }
        // Otherwise, get the token from our custom session
        const session = this.getCurrentSession();
        return session?.token || null;
    }
}

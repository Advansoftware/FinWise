// src/services/auth/mongodb-auth-adapter.ts

import { IAuthAdapter, AuthStateChangedCallback, Unsubscribe } from "./auth-adapter";
import { UserProfile } from "@/lib/types";
import { User as FirebaseUser } from "firebase/auth";

const SESSION_KEY = 'finwise_mongo_session';
const BROADCAST_CHANNEL_NAME = 'finwise_auth_channel';

// This is the structure of the data we'll store in localStorage
interface SessionData {
    user: UserProfile;
    token: string; 
}

export class MongoDbAuthAdapter implements IAuthAdapter {
    private channel: BroadcastChannel | null = null;
    private authStateCallback: AuthStateChangedCallback | null = null;
    private onIdTokenChangedUnsubscribe: Unsubscribe | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
            this.channel.onmessage = this.handleBroadcastMessage.bind(this);
        }
    }
    
    private handleBroadcastMessage(event: MessageEvent) {
        if (event.data.type === 'LOGIN' || event.data.type === 'LOGOUT') {
           if (this.authStateCallback) {
              this.notifyAuthStateChange();
           }
        }
    }
    
    private notifyAuthStateChange() {
        if (this.authStateCallback) {
            const session = this.getCurrentSession();
            this.authStateCallback(session ? this.mapProfileToFirebaseUser(session.user) : null);
        }
    }

    private saveSession(data: SessionData): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(SESSION_KEY, JSON.stringify(data));
        this.channel?.postMessage({ type: 'LOGIN' });
        this.notifyAuthStateChange();
    }

    private clearSession(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(SESSION_KEY);
        this.channel?.postMessage({ type: 'LOGOUT' });
        this.notifyAuthStateChange();
    }

    private getCurrentSession(): SessionData | null {
        if (typeof window === 'undefined') return null;
        const session = localStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    }
    
    // This is a mapping to satisfy the `User` type from `firebase/auth` expected by `useAuth`.
    // It creates a "mock" Firebase user object from our MongoDB user profile.
    private mapProfileToFirebaseUser(profile: UserProfile): FirebaseUser {
       return {
            uid: profile.uid,
            email: profile.email,
            displayName: profile.displayName,
            providerId: 'password',
            photoURL: null,
            emailVerified: true,
            isAnonymous: false,
            metadata: {},
            providerData: [],
            refreshToken: '',
            tenantId: null,
            delete: async () => {},
            getIdToken: async () => this.getToken() || '',
            getIdTokenResult: async () => ({} as any),
            reload: async () => {},
            toJSON: () => ({...profile}),
        } as unknown as FirebaseUser;
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
        this.saveSession(data);
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
        this.saveSession(data);
        return data.user;
    }

    async logout(): Promise<void> {
        this.clearSession();
    }
    
    onAuthStateChanged(callback: AuthStateChangedCallback): Unsubscribe {
        this.authStateCallback = callback;
        
        // Initial check
        this.notifyAuthStateChange();

        // The unsubscribe function
        return () => {
            this.authStateCallback = null;
            this.channel?.close();
        };
    }
    
    // These methods are not implemented for the MongoDB adapter and will throw errors if called.
    // The UI should prevent these calls when the MongoDB provider is active.
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
        const session = this.getCurrentSession();
        return session?.token || null;
    }
}

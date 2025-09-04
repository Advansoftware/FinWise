
// src/services/auth/mongodb-auth-adapter.ts

import { IAuthAdapter, AuthStateChangedCallback, Unsubscribe } from "./auth-adapter";
import { UserProfile } from "@/lib/types";
import { User as FirebaseUser, signOut } from "firebase/auth";
import { getFirebase } from "@/lib/firebase"; // Keep for session management if needed, or remove if going full stateless
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const USER_SESSION_KEY = 'finwise_user_session';


export class MongoDbAuthAdapter implements IAuthAdapter {
    private auth;
    private currentUser: UserProfile | null = null;
    private listeners: AuthStateChangedCallback[] = [];

    constructor() {
        // We still need the firebase auth instance for Google Sign-In and potentially session state if not using pure localStorage
        const { auth } = getFirebase();
        this.auth = auth;
        this.loadUserFromSession();
    }

    private loadUserFromSession() {
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem(USER_SESSION_KEY);
            if (storedUser) {
                this.currentUser = JSON.parse(storedUser);
            }
        }
    }

    private saveUserToSession(user: UserProfile | null) {
        if (typeof window !== 'undefined') {
            if (user) {
                localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
            } else {
                localStorage.removeItem(USER_SESSION_KEY);
            }
        }
        this.currentUser = user;
        this.notifyListeners();
    }
    
    private notifyListeners() {
        // Simulate Firebase's onAuthStateChanged by passing a compatible object or null
        const firebaseUser = this.currentUser ? { uid: this.currentUser.uid } as FirebaseUser : null;
        this.listeners.forEach(callback => callback(firebaseUser));
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
        this.saveUserToSession(data.user);
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
        this.saveUserToSession(data.user);
        return data.user;
    }

    async logout(): Promise<void> {
        this.saveUserToSession(null);
        // Also sign out of firebase if a google session exists
        if (this.auth.currentUser) {
            await signOut(this.auth);
        }
    }
    
    onAuthStateChanged(callback: AuthStateChangedCallback): Unsubscribe {
        this.listeners.push(callback);
        // Immediately call with current state
        const firebaseUser = this.currentUser ? { uid: this.currentUser.uid } as FirebaseUser : null;
        callback(firebaseUser);

        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }
    
     async signInWithGoogle(): Promise<UserProfile> {
        // This is now the ONLY part that uses Firebase auth directly, as a social provider.
        // The backend will trust the UID from the verified Google token.
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(this.auth, provider);
        
        // After Google sign-in, we hit our own backend to get/create a user profile
        // and establish our own session state.
        const idToken = await result.user.getIdToken();
        const response = await fetch('/api/users/social-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Google login failed on backend.");
        }
        
        this.saveUserToSession(data.user);
        return data.user;
    }
    
    async sendPasswordReset(email: string): Promise<void> {
        console.warn("sendPasswordReset is not implemented for the MongoDB adapter in this example.");
        throw new Error("Password reset is not available for this authentication method yet.");
    }
    
    async reauthenticate(password: string): Promise<void> {
        console.warn("reauthenticate is not implemented for the MongoDB adapter.");
        throw new Error("Reauthentication is not available for this method.");
    }

    async updateUserPassword(newPassword: string): Promise<void> {
         console.warn("updateUserPassword is not implemented for the MongoDB adapter.");
        throw new Error("Password update is not available for this method.");
    }

    async getToken(): Promise<string | null> {
        // This method becomes simpler. In a real-world JWT scenario, we'd store and return the JWT.
        // For our simple session, we can just return the user ID as a form of "token".
        // The backend API route will not use this token for verification.
        return this.currentUser?.uid || null;
    }
}

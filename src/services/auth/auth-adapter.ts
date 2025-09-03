// src/services/auth/auth-adapter.ts

import { UserProfile } from "@/lib/types";
import { User as FirebaseUser } from "firebase/auth";

export type AuthStateChangedCallback = (user: FirebaseUser | null) => void;
export type Unsubscribe = () => void;

/**
 * Interface (Port) for the Authentication Adapter.
 * Defines the contract that any authentication provider must follow.
 */
export interface IAuthAdapter {
    login(email: string, pass: string): Promise<UserProfile>;
    signup(email: string, pass: string, name: string): Promise<UserProfile>;
    logout(): Promise<void>;
    onAuthStateChanged(callback: AuthStateChangedCallback): Unsubscribe;
    signInWithGoogle(): Promise<UserProfile>;
    sendPasswordReset(email: string): Promise<void>;
    reauthenticate(password: string): Promise<void>;
    updateUserPassword(newPassword: string): Promise<void>;
    getToken(): Promise<string | null>;
}

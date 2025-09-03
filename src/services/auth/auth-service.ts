// src/services/auth/auth-service.ts
'use client';

import { IAuthAdapter } from "./auth-adapter";
import { FirebaseAuthAdapter } from "./firebase-auth-adapter";
import { MongoDbAuthAdapter } from "./mongodb-auth-adapter";

let currentAdapter: IAuthAdapter | null = null;
let currentAuthType: string | undefined = undefined;

/**
 * Authentication Service Factory.
 * Determines which auth adapter to use based on the environment variable.
 */
export function getAuthAdapter(): IAuthAdapter {
    if (typeof window === 'undefined') {
        // On the server, we might need a default adapter, but for auth, it's mostly a client concern.
        // We'll return the Firebase one as a safe default, but server-side auth logic should be handled with care.
        return new FirebaseAuthAdapter();
    }
    
    const authType = process.env.NEXT_PUBLIC_AUTH_PROVIDER;

    // If the adapter type has changed, or if it's not initialized yet
    if (currentAuthType !== authType || !currentAdapter) {
        console.log(`Initializing auth adapter of type: ${authType || 'firebase'}`);
        currentAuthType = authType;

        switch (authType) {
            case 'mongodb':
                currentAdapter = new MongoDbAuthAdapter();
                break;
            case 'firebase':
            default:
                currentAdapter = new FirebaseAuthAdapter();
                break;
        }
    }

    return currentAdapter;
}

// src/services/auth/auth-service.ts
'use client';

import { IAuthAdapter } from "./auth-adapter";
import { FirebaseAuthAdapter } from "./firebase-auth-adapter";
import { MongoDbAuthAdapter } from "./mongodb-auth-adapter";

// No more caching of the adapter instance.
// let currentAdapter: IAuthAdapter | null = null;
// let currentAuthType: string | undefined = undefined;

/**
 * Authentication Service Factory.
 * Determines which auth adapter to use based on the environment variable on each call.
 * This ensures the application always respects the .env configuration without caching stale instances.
 */
export function getAuthAdapter(): IAuthAdapter {
    if (typeof window === 'undefined') {
        // On the server, Firebase Admin SDK is used for operations like token verification,
        // so returning a client-side adapter isn't applicable.
        // We'll return a Firebase one as a safe default, though server actions shouldn't rely on this client-side factory.
        return new FirebaseAuthAdapter();
    }
    
    // Read the environment variable EVERY time the function is called.
    const authType = process.env.NEXT_PUBLIC_AUTH_PROVIDER;

    // Instantiate the correct adapter based on the current .env value.
    switch (authType) {
        case 'mongodb':
            // console.log("Auth Service: Returning MongoDbAuthAdapter instance.");
            return new MongoDbAuthAdapter();
        case 'firebase':
        default:
            // console.log("Auth Service: Returning FirebaseAuthAdapter instance.");
            return new FirebaseAuthAdapter();
    }
}

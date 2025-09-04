// src/services/auth/auth-service.ts
'use client';

import { IAuthAdapter } from "./auth-adapter";
import { FirebaseAuthAdapter } from "./firebase-auth-adapter";
import { MongoDbAuthAdapter } from "./mongodb-auth-adapter";

let adapterInstance: IAuthAdapter | null = null;
let currentAuthType: string | undefined = undefined;

/**
 * Authentication Service Factory.
 * Determines which auth adapter to use based on the environment variable.
 * It caches the adapter instance to prevent re-creation on every call,
 * but re-creates it if the environment variable changes.
 */
export function getAuthAdapter(): IAuthAdapter {
    const authType = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'firebase';

    if (adapterInstance && currentAuthType === authType) {
        return adapterInstance;
    }

    currentAuthType = authType;

    switch (authType) {
        case 'mongodb':
            adapterInstance = new MongoDbAuthAdapter();
            break;
        case 'firebase':
        default:
            adapterInstance = new FirebaseAuthAdapter();
            break;
    }
    
    return adapterInstance;
}

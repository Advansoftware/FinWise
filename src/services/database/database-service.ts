// src/services/database/database-service.ts
'use client';

import { IDatabaseAdapter } from "./database-adapter";
import { FirebaseAdapter } from "./firebase-adapter";
import { IndexedDBAdapter } from "./indexeddb-adapter";
import { MongoDbAdapter } from "./mongodb-adapter";

let currentAdapter: IDatabaseAdapter | null = null;

/**
 * Database Service Factory.
 * Determines which database adapter to use based on the environment variable.
 * This is the single point of entry for all data persistence operations in the application.
 */
export function getDatabaseAdapter(): IDatabaseAdapter {
    if (currentAdapter) {
        return currentAdapter;
    }

    const dbType = process.env.NEXT_PUBLIC_DATABASE_TYPE;
    
    // Server-Side Guard: On the server, we can't use a client-side adapter.
    // We can either fallback to a default server-compatible one or handle it gracefully.
    if (typeof window === 'undefined' && dbType === 'indexeddb') {
        // This is a temporary dummy adapter for the server pass.
        // It won't be used for actual data operations, which happen client-side.
        return {
            listenToCollection: () => () => {},
            getDoc: async () => null,
            ensureUserProfile: async () => {},
            addDoc: async () => 'dummy-id',
            setDoc: async () => {},
            updateDoc: async () => {},
            deleteDoc: async () => {},
            runTransaction: async (fn: any) => fn({}),
            increment: (val: number) => val,
            queryConstraint: () => ({}),
        } as IDatabaseAdapter;
    }

    console.log(`Initializing database adapter of type: ${dbType || 'firebase'}`);

    switch (dbType) {
        case 'mongodb':
            currentAdapter = new MongoDbAdapter();
            break;
        case 'indexeddb':
            currentAdapter = new IndexedDBAdapter();
            break;
        case 'firebase':
        default:
            currentAdapter = new FirebaseAdapter();
            break;
    }

    return currentAdapter;
}

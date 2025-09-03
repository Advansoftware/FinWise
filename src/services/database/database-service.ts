// src/services/database/database-service.ts
'use client';

import { IDatabaseAdapter } from "./database-adapter";
import { FirebaseAdapter } from "./firebase-adapter";
import { MongoDbAdapter } from "./mongodb-adapter";

let currentAdapter: IDatabaseAdapter | null = null;

/**
 * Database Service Factory.
 * Determines which database adapter to use based on the environment variable.
 * This is the single point of entry for all data persistence operations in the application.
 */
export function getDatabaseAdapter(): IDatabaseAdapter {
    if (typeof window === 'undefined') {
        // On the server, we might need a default or specific admin adapter.
        // For now, let's assume server-side data access uses a different mechanism (e.g., admin SDKs).
        // This avoids instantiating client-side adapters on the server.
        return new FirebaseAdapter(); // Default to a safe server-compatible choice if needed.
    }
    
    if (currentAdapter) {
        return currentAdapter;
    }

    const dbType = process.env.NEXT_PUBLIC_DATABASE_TYPE;
    
    console.log(`Initializing database adapter of type: ${dbType || 'firebase'}`);

    switch (dbType) {
        case 'mongodb':
            currentAdapter = new MongoDbAdapter();
            break;
        case 'firebase':
        default:
            currentAdapter = new FirebaseAdapter();
            break;
    }

    return currentAdapter;
}

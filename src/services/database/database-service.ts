// src/services/database/database-service.ts
'use client';

import { IDatabaseAdapter } from "./database-adapter";
import { FirebaseAdapter } from "./firebase-adapter";
import { MongoDbAdapter } from "./mongodb-adapter";

/**
 * Database Service Factory.
 * Determines which database adapter to use based on the environment variable on each call.
 * This is the single point of entry for all data persistence operations in the application.
 * It does not cache the adapter instance to ensure the .env variable is always respected.
 */
export function getDatabaseAdapter(): IDatabaseAdapter {
    if (typeof window === 'undefined') {
        // On the server, we might need a default or specific admin adapter.
        // For now, let's assume server-side data access uses a different mechanism (e.g., admin SDKs).
        // This avoids instantiating client-side adapters on the server.
        // Returning FirebaseAdapter as a safe default for type consistency, though it shouldn't be used server-side from this factory.
        return new FirebaseAdapter();
    }
    
    // Read the environment variable EVERY time the function is called.
    const dbType = process.env.NEXT_PUBLIC_DATABASE_TYPE;
    
    // Instantiate the correct adapter based on the current .env value.
    switch (dbType) {
        case 'mongodb':
            return new MongoDbAdapter();
        case 'firebase':
        default:
            return new FirebaseAdapter();
    }
}

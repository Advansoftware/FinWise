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

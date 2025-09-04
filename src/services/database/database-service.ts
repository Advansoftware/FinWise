// src/services/database/database-service.ts
'use client';

import { IDatabaseAdapter } from "./database-adapter";
import { FirebaseAdapter } from "./firebase-adapter";
import { MongoDbAdapter } from "./mongodb-adapter";

let adapterInstance: IDatabaseAdapter | null = null;
let currentDbType: string | undefined = undefined;


/**
 * Database Service Factory.
 * Determines which database adapter to use based on the environment variable.
 * It caches the adapter instance to prevent re-creation on every call,
 * but re-creates it if the environment variable changes.
 */
export function getDatabaseAdapter(): IDatabaseAdapter {
    const dbType = process.env.NEXT_PUBLIC_DATABASE_TYPE || 'firebase';

    if (adapterInstance && currentDbType === dbType) {
        return adapterInstance;
    }

    currentDbType = dbType;

    switch (dbType) {
        case 'mongodb':
            adapterInstance = new MongoDbAdapter();
            break;
        case 'firebase':
        default:
            adapterInstance = new FirebaseAdapter();
            break;
    }

    return adapterInstance;
}

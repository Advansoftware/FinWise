// src/services/database/indexeddb-adapter.ts
import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { DocumentData, QueryConstraint } from "firebase/firestore";
import { User } from 'firebase/auth';
import { IDatabaseAdapter, Unsubscribe } from "./database-adapter";
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'finwiseDB';
const DB_VERSION = 1;
const STORES = ['users', 'transactions', 'wallets', 'budgets', 'goals', 'settings', 'aiCreditLogs', 'reports', 'annualReports'];

interface FinWiseDBSchema extends DBSchema {
  [key: string]: {
    key: string;
    value: any;
    indexes?: { [key: string]: string | string[] };
  };
}

// This adapter provides a fully client-side experience using IndexedDB.
// It does NOT support real-time updates between different browser tabs.
export class IndexedDBAdapter implements IDatabaseAdapter {
    private dbPromise: Promise<IDBPDatabase<FinWiseDBSchema>>;
    private userId: string | null = null;

    constructor() {
        this.dbPromise = openDB<FinWiseDBSchema>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                for (const storeName of STORES) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { keyPath: 'id' });
                        if (storeName !== 'users') {
                            store.createIndex('by-userId', 'userId');
                        }
                    }
                }
            },
        });
        // This is a simplification; a real app would use the auth context.
        // For now, we assume a single user or a way to get the current user ID.
    }

    private setUserId(id: string | null) {
        this.userId = id;
    }

    private getUserId(): string {
       if (!this.userId) {
          // Attempt to get from a hypothetical auth state if not set
          // This part is tricky without direct access to auth state.
          // The useAuth hook will call setUserId on this adapter instance.
       }
       if (!this.userId) throw new Error("User not authenticated for IndexedDB operations.");
       return this.userId;
    }

    private resolvePath(path: string): { storeName: string, id?: string } {
        const parts = path.split('/');
        if (parts.length === 1) return { storeName: parts[0] }; // e.g., 'users'
        if (parts[0] === 'users' && parts[1] === 'USER_ID') {
            return { storeName: parts[2], id: parts[3] };
        }
        return { storeName: parts[0], id: parts[1] };
    }
    
    // NOTE: This implementation of listenToCollection does not provide real-time updates.
    // It fetches the data once. A full real-time implementation would be complex.
    listenToCollection<T>(collectionPath: string, callback: (data: T[]) => void, constraints?: QueryConstraint[]): Unsubscribe {
        const { storeName } = this.resolvePath(collectionPath);
        const userId = this.getUserId();
        
        const fetchData = async () => {
            try {
                const db = await this.dbPromise;
                let results: T[];
                if (storeName === 'users') {
                    results = await db.getAll(storeName as any);
                } else {
                    results = await db.getAllFromIndex(storeName as any, 'by-userId', userId);
                }
                callback(results);
            } catch (error) {
                console.error(`Error fetching from IndexedDB store ${storeName}:`, error);
                callback([]);
            }
        };

        fetchData();

        // Return a no-op unsubscribe function as this is not a real-time listener.
        return () => {};
    }

    async getDoc<T>(docPath: string): Promise<T | null> {
        const { storeName, id } = this.resolvePath(docPath);
        if (!id) return null;
        const db = await this.dbPromise;
        const data = await db.get(storeName as any, id);
        return (data as T) || null;
    }

    async ensureUserProfile(user: User): Promise<void> {
        this.setUserId(user.uid); // Set userId for subsequent operations
        const db = await this.dbPromise;
        const existingUser = await db.get('users', user.uid);
        if (!existingUser) {
            const newUserProfile = {
                id: user.uid,
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                plan: 'Básico',
                aiCredits: 0,
                createdAt: new Date().toISOString(),
            };
            await db.put('users', newUserProfile);
        }
    }

    async addDoc<T extends DocumentData>(collectionPath: string, data: T): Promise<string> {
        const { storeName } = this.resolvePath(collectionPath);
        const db = await this.dbPromise;
        const newId = uuidv4();
        const newDoc = {
            ...data,
            id: newId,
            userId: this.getUserId(),
            createdAt: new Date().toISOString(),
        };
        await db.add(storeName as any, newDoc);
        return newId;
    }

    async setDoc<T extends DocumentData>(docPath: string, data: T): Promise<void> {
        const { storeName, id } = this.resolvePath(docPath);
        if (!id) throw new Error("Document ID is required for setDoc");
        const db = await this.dbPromise;
        const docToSet = { ...data, id };
        if (storeName !== 'users') {
           (docToSet as any).userId = this.getUserId();
        }
        await db.put(storeName as any, docToSet);
    }
    
    async updateDoc(docPath: string, data: Partial<DocumentData>): Promise<void> {
        const { storeName, id } = this.resolvePath(docPath);
        if (!id) throw new Error("Document ID is required for updateDoc");
        const db = await this.dbPromise;
        const existing = await db.get(storeName as any, id);
        if (existing) {
            const updated = { ...existing, ...data };
            await db.put(storeName as any, updated);
        }
    }

    async deleteDoc(docPath: string): Promise<void> {
        const { storeName, id } = this.resolvePath(docPath);
        if (!id) throw new Error("Document ID is required for deleteDoc");
        const db = await this.dbPromise;
        await db.delete(storeName as any, id);
    }
    
    // Transactions in IndexedDB are complex. This is a simplified, non-atomic stub.
    async runTransaction(updateFunction: (transaction: any) => Promise<any>): Promise<any> {
        console.warn("IndexedDBAdapter does not support true atomic transactions. Operations will be performed sequentially.");
        const dummyTransaction = {
            get: this.getDoc.bind(this),
            set: this.setDoc.bind(this),
            update: this.updateDoc.bind(this),
            delete: this.deleteDoc.bind(this)
        };
        return updateFunction(dummyTransaction);
    }

    // A real implementation would need to fetch, calculate, and update.
    increment(value: number) {
        console.warn("IndexedDBAdapter does not support atomic increments. This operation is not safe in concurrent environments.");
        // This is a placeholder and not a true atomic increment.
        return { __indexeddb_increment: value };
    }
}

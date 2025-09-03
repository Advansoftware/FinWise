// src/services/database/indexeddb-adapter.ts
import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { DocumentData } from "firebase/firestore";
import { User } from 'firebase/auth';
import { IDatabaseAdapter, Unsubscribe, QueryConstraint } from "./database-adapter";
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
    private listeners: Map<string, ((data: any[]) => void)[]> = new Map();


    constructor() {
        if (typeof window === 'undefined') {
            // This is a safeguard. The actual prevention happens in the factory.
            this.dbPromise = new Promise(() => {}); // Create a non-resolving promise on the server
            return;
        }

        this.dbPromise = openDB<FinWiseDBSchema>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                for (const storeName of STORES) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { keyPath: 'id' });
                        if (storeName !== 'users') {
                            store.createIndex('by-userId', 'userId');
                        }
                         if (storeName === 'transactions' || storeName === 'budgets' || storeName === 'goals' || storeName === 'wallets') {
                            store.createIndex('by-createdAt', 'createdAt');
                        }
                    }
                }
            },
        });
    }

    private setUserId(id: string | null) {
        this.userId = id;
    }

    private getUserId(): string {
       if (!this.userId) {
          const storedUser = localStorage.getItem('finwise_user_id');
          if (storedUser) this.userId = storedUser;
       }
       if (!this.userId) throw new Error("User not authenticated for IndexedDB operations.");
       return this.userId;
    }
    
    private async notifyListeners(storeName: string) {
        const cbs = this.listeners.get(storeName);
        if (cbs) {
            const db = await this.dbPromise;
            const userId = this.getUserId();
            const data = storeName === 'users' ? await db.getAll(storeName as any) : await db.getAllFromIndex(storeName as any, 'by-userId', userId);
            cbs.forEach(cb => cb(data));
        }
    }

    private resolvePath(path: string): { storeName: string, id?: string } {
        const parts = path.split('/');
        if (parts.length === 1) return { storeName: parts[0] }; 
        if (parts[0] === 'users' && parts.length === 2 && parts[1] !== 'USER_ID') return { storeName: 'users', id: parts[1] };
        if (parts[0] === 'users' && parts[1] === 'USER_ID') {
            return { storeName: parts[2], id: parts[3] };
        }
        return { storeName: parts[0], id: parts[1] };
    }

    listenToCollection<T>(collectionPath: string, callback: (data: T[]) => void, constraints?: any[]): Unsubscribe {
        const { storeName } = this.resolvePath(collectionPath);
        
        if (!this.listeners.has(storeName)) {
            this.listeners.set(storeName, []);
        }
        this.listeners.get(storeName)!.push(callback);

        const fetchData = async () => {
             try {
                const db = await this.dbPromise;
                const userId = this.getUserId();
                let results: T[];
                if (storeName === 'users') {
                    results = await db.getAll(storeName as any);
                } else {
                    results = await db.getAllFromIndex(storeName as any, 'by-userId', userId);
                }
                
                // Manual sorting based on constraints
                if(constraints) {
                   for (const constraint of constraints) {
                       if (constraint.type === 'orderBy' && constraint.field === 'createdAt' && constraint.direction === 'desc') {
                           results.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                       }
                   }
                }
                
                callback(results);
            } catch (error) {
                console.error(`Error fetching from IndexedDB store ${storeName}:`, error);
                callback([]);
            }
        };

        fetchData();

        const unsubscribe = () => {
            const cbs = this.listeners.get(storeName);
            if (cbs) {
                const index = cbs.indexOf(callback);
                if (index > -1) {
                    cbs.splice(index, 1);
                }
            }
        };

        return unsubscribe;
    }

    async getDoc<T>(docPath: string): Promise<T | null> {
        const { storeName, id } = this.resolvePath(docPath);
        if (!id) return null;
        const db = await this.dbPromise;
        const data = await db.get(storeName as any, id);
        return (data as T) || null;
    }

    async ensureUserProfile(user: User): Promise<void> {
        this.setUserId(user.uid); 
        localStorage.setItem('finwise_user_id', user.uid);
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
            await this.notifyListeners('users');
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
        await this.notifyListeners(storeName);
        return newId;
    }

    async setDoc<T extends DocumentData>(docPath: string, data: T): Promise<void> {
        const { storeName, id } = this.resolvePath(docPath);
        if (!id) throw new Error("Document ID is required for setDoc");
        const db = await this.dbPromise;
        
        const existing = await db.get(storeName as any, id);
        const docToSet = { ...(existing || {}), ...data, id };
        
        if (storeName !== 'users' && !docToSet.userId) {
           docToSet.userId = this.getUserId();
        }
        await db.put(storeName as any, docToSet);
        await this.notifyListeners(storeName);
    }
    
    async updateDoc(docPath: string, data: Partial<DocumentData>): Promise<void> {
        const { storeName, id } = this.resolvePath(docPath);
        if (!id) throw new Error("Document ID is required for updateDoc");
        const db = await this.dbPromise;
        const existing = await db.get(storeName as any, id);
        if (existing) {
            const updated = { ...existing, ...data };
            await db.put(storeName as any, updated);
            await this.notifyListeners(storeName);
        }
    }

    async deleteDoc(docPath: string): Promise<void> {
        const { storeName, id } = this.resolvePath(docPath);
        if (!id) throw new Error("Document ID is required for deleteDoc");
        const db = await this.dbPromise;
        await db.delete(storeName as any, id);
        await this.notifyListeners(storeName);
    }
    
    async runTransaction(updateFunction: (transaction: any) => Promise<any>): Promise<any> {
        console.warn("IndexedDBAdapter: Transactions are not atomic. Simulating for development.");
        
        const txPromises: Promise<any>[] = [];

        const dummyTransaction = {
            get: this.getDoc.bind(this),
            set: (docPath: string, data: DocumentData) => {
                txPromises.push(this.setDoc(docPath, data));
            },
            update: (docPath: string, data: Partial<DocumentData>) => {
                txPromises.push(this.updateDoc(docPath, data));
            },
            delete: (docPath: string) => {
                txPromises.push(this.deleteDoc(docPath));
            }
        };

        await updateFunction(dummyTransaction);
        await Promise.all(txPromises);
    }

    increment(value: number): any {
        return { __idb_increment: value };
    }

    queryConstraint(type: 'orderBy' | 'where', field: string, ...args: any[]): any {
        // This is a mock. The actual filtering/sorting is done in listenToCollection for IndexedDB.
        return { type, field, direction: args[0], operator: args[0], value: args[1] };
    }
}

// src/services/database/localstorage-adapter.ts

import { DocumentData, QueryConstraint } from "firebase/firestore";
import { IDatabaseAdapter, Unsubscribe } from "./database-adapter";
import { v4 as uuidv4 } from 'uuid';

// This is a simplified, client-side only adapter for demonstration and testing.
// It does not support real-time updates between tabs.
export class LocalStorageAdapter implements IDatabaseAdapter {
    private prefix = 'finwise-local-';

    private getFullKey(path: string): string {
        // This simple implementation treats collection paths as keys.
        // e.g., 'users/USER_ID/transactions' becomes 'finwise-local-transactions'
        // A more robust implementation would handle nested paths.
        const parts = path.split('/');
        // Assuming path is like 'users/USER_ID/collectionName'
        const collectionName = parts[parts.length - 1];
        return `${this.prefix}${collectionName}`;
    }

    listenToCollection<T extends {id: string}>(collectionPath: string, callback: (data: T[]) => void, constraints: QueryConstraint[] = []): Unsubscribe {
        const key = this.getFullKey(collectionPath);
        try {
            const rawData = localStorage.getItem(key);
            const data = rawData ? JSON.parse(rawData) : [];
            callback(data);
        } catch (e) {
            console.error("Error reading from localStorage:", e);
            callback([]);
        }
        
        // This adapter doesn't support real-time listening, so we just return a no-op.
        // A real implementation might use storage events.
        return () => {};
    }

    async getDoc<T extends {id: string}>(docPath: string): Promise<T | null> {
         const parts = docPath.split('/');
         const collectionPath = parts.slice(0, -1).join('/');
         const docId = parts[parts.length - 1];

         const key = this.getFullKey(collectionPath);
         const rawData = localStorage.getItem(key);
         const collectionData: T[] = rawData ? JSON.parse(rawData) : [];
         return collectionData.find(doc => doc.id === docId) || null;
    }

    async addDoc<T extends DocumentData>(collectionPath: string, data: T): Promise<string> {
        const key = this.getFullKey(collectionPath);
        const rawData = localStorage.getItem(key);
        const collectionData: T[] = rawData ? JSON.parse(rawData) : [];
        const newId = uuidv4();
        const newDoc = { ...data, id: newId, createdAt: new Date().toISOString() };
        collectionData.push(newDoc);
        localStorage.setItem(key, JSON.stringify(collectionData));
        return newId;
    }

    async setDoc<T extends {id?: string}>(docPath: string, data: T): Promise<void> {
        const parts = docPath.split('/');
        const collectionPath = parts.slice(0, -1).join('/');
        const docId = parts[parts.length - 1];

        const key = this.getFullKey(collectionPath);
        const rawData = localStorage.getItem(key);
        const collectionData: T[] = rawData ? JSON.parse(rawData) : [];
        
        const docIndex = collectionData.findIndex(d => d.id === docId);

        if (docIndex > -1) {
            // Update existing
            collectionData[docIndex] = { ...collectionData[docIndex], ...data };
        } else {
            // Create new
            collectionData.push({ ...data, id: docId });
        }
        localStorage.setItem(key, JSON.stringify(collectionData));
    }

    async updateDoc(docPath: string, data: Partial<DocumentData>): Promise<void> {
        return this.setDoc(docPath, data as any);
    }
    
    async deleteDoc(docPath: string): Promise<void> {
         const parts = docPath.split('/');
         const collectionPath = parts.slice(0, -1).join('/');
         const docId = parts[parts.length - 1];

         const key = this.getFullKey(collectionPath);
         const rawData = localStorage.getItem(key);
         const collectionData: any[] = rawData ? JSON.parse(rawData) : [];
         
         const updatedData = collectionData.filter(d => d.id !== docId);
         localStorage.setItem(key, JSON.stringify(updatedData));
    }

    // Transactions and increments are complex and not easily implemented in localStorage.
    // These are simplified stubs.
    async runTransaction(updateFunction: (transaction: any) => Promise<any>): Promise<any> {
        console.warn("LocalStorageAdapter does not support transactions. Running non-atomically.");
        // A dummy transaction object
        const dummyTransaction = {
            get: this.getDoc.bind(this),
            set: this.setDoc.bind(this),
            update: this.updateDoc.bind(this),
            delete: this.deleteDoc.bind(this)
        };
        return updateFunction(dummyTransaction);
    }

    increment(value: number) {
        // This is a special marker object that the hooks would need to interpret.
        // For simplicity, our hooks won't support this with the localStorage adapter.
        console.warn("LocalStorageAdapter does not properly support increment.");
        return { __local_increment: value };
    }
}

// src/services/database/mongodb-adapter.ts

import { DocumentData, QueryConstraint } from "firebase/firestore";
import { IDatabaseAdapter, Unsubscribe } from "./database-adapter";

// Helper to construct API URL
const getApiUrl = (path: string) => `/api/data/${path}`;

export class MongoDbAdapter implements IDatabaseAdapter {

    private sseConnections: Map<string, EventSource> = new Map();

    listenToCollection<T>(collectionPath: string, callback: (data: T[]) => void, constraints?: QueryConstraint[]): Unsubscribe {
        const path = collectionPath.replace('users/USER_ID/', '');
        const apiUrl = getApiUrl(path);

        // Close any existing connection for this path
        if (this.sseConnections.has(path)) {
            this.sseConnections.get(path)?.close();
        }

        // Use Server-Sent Events for real-time updates
        const eventSource = new EventSource(`${apiUrl}/subscribe`);
        this.sseConnections.set(path, eventSource);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            callback(data as T[]);
        };

        eventSource.onerror = (err) => {
            console.error(`SSE error for ${path}:`, err);
            eventSource.close();
            this.sseConnections.delete(path);
        };
        
        const unsubscribe = () => {
            eventSource.close();
            this.sseConnections.delete(path);
        };

        return unsubscribe;
    }

    async getDoc<T>(docPath: string): Promise<T | null> {
        const path = docPath.replace('users/USER_ID/', '');
        const response = await fetch(getApiUrl(path));
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`Failed to get doc: ${await response.text()}`);
        }
        return response.json();
    }
    
    async addDoc<T extends DocumentData>(collectionPath: string, data: T): Promise<string> {
        const path = collectionPath.replace('users/USER_ID/', '');
        const response = await fetch(getApiUrl(path), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Failed to add doc: ${await response.text()}`);
        const { insertedId } = await response.json();
        return insertedId;
    }

    async setDoc<T extends DocumentData>(docPath: string, data: T): Promise<void> {
        const path = docPath.replace('users/USER_ID/', '');
        const response = await fetch(getApiUrl(path), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Failed to set doc: ${await response.text()}`);
    }

    async updateDoc(docPath: string, data: Partial<DocumentData>): Promise<void> {
         const path = docPath.replace('users/USER_ID/', '');
         const response = await fetch(getApiUrl(path), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ '$set': data }), // Use $set for updates
        });
        if (!response.ok) throw new Error(`Failed to update doc: ${await response.text()}`);
    }

    async deleteDoc(docPath: string): Promise<void> {
        const path = docPath.replace('users/USER_ID/', '');
        const response = await fetch(getApiUrl(path), {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error(`Failed to delete doc: ${await response.text()}`);
    }
    
    // Transactions and increments are server-side logic in MongoDB.
    // This adapter would need a dedicated API endpoint for transactions.
    // This is a simplified stub.
    async runTransaction(updateFunction: (transaction: any) => Promise<any>): Promise<any> {
       console.warn("MongoDbAdapter: Transactions must be implemented as a dedicated API endpoint.");
       // This would involve sending the entire sequence of operations to a special /api/transaction endpoint.
       // For now, we'll just throw an error.
       throw new Error("Transactions not implemented for MongoDB adapter.");
    }

    increment(value: number): any {
       // This returns a special object that the API route will interpret
       return { '$inc': value };
    }
}

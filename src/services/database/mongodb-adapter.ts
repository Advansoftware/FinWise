// src/services/database/mongodb-adapter.ts

import { DocumentData, QueryConstraint } from "firebase/firestore";
import { IDatabaseAdapter, Unsubscribe } from "./database-adapter";
import { User } from "firebase/auth";

// Helper to construct API URL
const getApiUrl = (path: string) => `/api/data/${path}`;

export class MongoDbAdapter implements IDatabaseAdapter {

    constructor() {
      // No client-side initialization needed for this adapter
    }

    private getAuthHeader = async () => {
      // In a real app, this would dynamically get the current user's JWT token
      // For now, we'll simulate it or require it to be passed in.
      // This part is complex because it ties into the auth state.
      // Let's assume for now the API is secured by other means or this is handled.
      return { 'Authorization': 'Bearer SIMULATED_TOKEN' };
    }

    listenToCollection<T>(collectionPath: string, callback: (data: T[]) => void, constraints?: any[]): Unsubscribe {
        const path = collectionPath.replace('users/USER_ID/', '');
        
        // Polling as a fallback for real-time, since SSE from Next.js API routes can be tricky.
        let isSubscribed = true;
        const intervalId = setInterval(async () => {
            if (!isSubscribed) return;
            try {
                const response = await fetch(getApiUrl(path), { headers: await this.getAuthHeader() });
                if (response.ok) {
                    const data = await response.json();
                    callback(data as T[]);
                }
            } catch (error) {
                console.error(`Polling error for ${path}:`, error);
            }
        }, 5000); // Poll every 5 seconds

        // Initial fetch
        (async () => {
             try {
                const response = await fetch(getApiUrl(path), { headers: await this.getAuthHeader() });
                if (response.ok) {
                    const data = await response.json();
                    callback(data as T[]);
                }
            } catch (error) {
                console.error(`Initial fetch error for ${path}:`, error);
            }
        })();
        
        const unsubscribe = () => {
            isSubscribed = false;
            clearInterval(intervalId);
        };

        return unsubscribe;
    }

    async getDoc<T>(docPath: string): Promise<T | null> {
        const path = docPath.replace('users/USER_ID/', '');
        const response = await fetch(getApiUrl(path), { headers: await this.getAuthHeader() });
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
            headers: { 'Content-Type': 'application/json', ...(await this.getAuthHeader()) },
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
            headers: { 'Content-Type': 'application/json', ...(await this.getAuthHeader()) },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Failed to set doc: ${await response.text()}`);
    }

    async updateDoc(docPath: string, data: Partial<DocumentData>): Promise<void> {
         const path = docPath.replace('users/USER_ID/', '');
         const response = await fetch(getApiUrl(path), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...(await this.getAuthHeader()) },
            body: JSON.stringify({ '$set': data }), // Use $set for updates
        });
        if (!response.ok) throw new Error(`Failed to update doc: ${await response.text()}`);
    }

    async deleteDoc(docPath: string): Promise<void> {
        const path = docPath.replace('users/USER_ID/', '');
        const response = await fetch(getApiUrl(path), {
            method: 'DELETE',
            headers: await this.getAuthHeader()
        });
        if (!response.ok && response.status !== 204) throw new Error(`Failed to delete doc: ${await response.text()}`);
    }
    
    async ensureUserProfile(user: User): Promise<void> {
       const profile = await this.getDoc(`users/${user.uid}`);
       if (!profile) {
           const newUserProfile = {
                _id: user.uid, // In Mongo, we often control the ID
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                plan: 'Básico',
                aiCredits: 0,
                createdAt: new Date().toISOString(),
           };
           // In REST, a POST to a collection creates a resource.
           // A PUT to a specific resource ID creates/replaces it.
           // So we use setDoc (which maps to PUT).
           await this.setDoc(`users/${user.uid}`, newUserProfile);
       }
    }

    async runTransaction(updateFunction: (transaction: any) => Promise<any>): Promise<any> {
       console.warn("MongoDbAdapter: Transactions must be implemented as a dedicated API endpoint.");
       throw new Error("Transactions not implemented for MongoDB adapter on the client-side.");
    }

    increment(value: number): any {
       return { '$inc': { field: value } }; // This is tricky. The API route needs to know which field to increment.
    }

    queryConstraint(type: 'orderBy' | 'where' | 'limit', field: string, operator: any, value?: any): any {
      // This would need to be translated into query parameters for the API call
      // e.g. /api/data/transactions?orderBy=date&direction=desc
      console.warn("MongoDbAdapter: Query constraints must be implemented via API query parameters.");
      return {};
    }
}

// src/services/database/mongodb-adapter.ts

import { DocumentData } from "firebase/firestore";
import { IDatabaseAdapter, Unsubscribe } from "./database-adapter";
import { User } from "firebase/auth";
import { UserProfile } from "@/lib/types";
import { getAuthAdapter } from "../auth/auth-service";

// Helper to construct API URL
const getApiUrl = (path: string) => `/api/data/${path}`;

export class MongoDbAdapter implements IDatabaseAdapter {

    constructor() {
      // No client-side initialization needed for this adapter
    }

    private async getAuthHeader() {
        const authAdapter = getAuthAdapter();
        const token = await authAdapter.getToken();
        if (!token) {
            // This case might happen during public page loads before auth state is known.
            // API routes should handle requests without tokens gracefully (e.g., return 401).
            return {};
        }
        return { 'Authorization': `Bearer ${token}` };
    }

    listenToCollection<T>(collectionPath: string, callback: (data: T[]) => void, constraints?: any[]): Unsubscribe {
        const path = collectionPath.replace('users/USER_ID/', '');
        
        let isSubscribed = true;

        const fetchData = async () => {
            if (!isSubscribed) return;
            try {
                const response = await fetch(getApiUrl(path), { headers: await this.getAuthHeader() });
                if (response.ok) {
                    const data = await response.json();
                    if(isSubscribed) {
                        callback(data as T[]);
                    }
                } else if (response.status === 401) {
                    // User is not authenticated, clear the data
                    if(isSubscribed) {
                        callback([]);
                    }
                }
            } catch (error) {
                console.error(`Fetch error for ${path}:`, error);
                 if(isSubscribed) {
                    callback([]);
                }
            }
        };

        // Polling as a fallback for real-time, since SSE from Next.js API routes can be tricky.
        const intervalId = setInterval(fetchData, 10000); // Poll every 10 seconds

        // Initial fetch
        fetchData();
        
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
            if (response.status === 401) return null; // Not authorized means no doc
            if (response.status === 404) return null;
            throw new Error(`Failed to get doc: ${await response.text()}`);
        }
        const data = await response.json();
        // The API returns the document with _id. Map it to id and uid for consistency with Firebase adapter.
        if (data && data._id) {
            data.id = data._id;
            data.uid = data._id;
        }
        return data;
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
           const newUserProfile: Omit<UserProfile, 'uid'> = {
                email: user.email,
                displayName: user.displayName,
                plan: 'Básico',
                aiCredits: 0,
                createdAt: new Date().toISOString(),
           };
           await this.setDoc(`users/${user.uid}`, newUserProfile);
       }
    }

    async runTransaction(updateFunction: (transaction: any) => Promise<any>): Promise<any> {
       console.warn("MongoDbAdapter: Client-side transactions are not supported. Operations must be atomic API endpoints.");
       throw new Error("Transactions not implemented for MongoDB adapter on the client-side.");
    }

    increment(value: number): any {
       // This needs to be handled by the API. The API will receive a special object indicating an increment operation.
       return { __op: 'Increment', value };
    }

    queryConstraint(type: 'orderBy' | 'where' | 'limit', field: string, operator: any, value?: any): any {
      console.warn("MongoDbAdapter: Query constraints must be implemented via API query parameters and are not yet supported in this adapter.");
      return {};
    }
}

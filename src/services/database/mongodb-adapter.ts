// src/services/database/mongodb-adapter.ts

import { DocumentData } from "firebase/firestore";
import { IDatabaseAdapter, Unsubscribe } from "./database-adapter";
import { User } from "firebase/auth";
import { UserProfile } from "@/lib/types";
import { getAuthAdapter } from "../auth/auth-service";

// Helper to construct API URL
const getApiUrl = (path: string) => `/api/data/${path}`;

export class MongoDbAdapter implements IDatabaseAdapter {
    private userId: string | null = null;

    constructor() {
      // No client-side initialization needed for this adapter
    }

    public setCurrentUser(userId: string | null) {
        this.userId = userId;
    }

    private async getAuthHeader() {
        const authAdapter = getAuthAdapter();
        const token = await authAdapter.getToken();
        if (!token) {
            // This might happen during sign-out, it's not necessarily an error.
            return {};
        }
        return { 'Authorization': `Bearer ${token}` };
    }
    
    private resolvePath(path: string): string {
        if (!this.userId) {
            // This is a critical issue if it happens during an operation that requires a user.
            console.error("MongoDBAdapter: userId not set, cannot resolve path", path);
            // We'll let it proceed, but the API will likely reject it, which is correct.
            return path.replace('USER_ID', 'undefined');
        }
        return path.replace('USER_ID', this.userId);
    }

    listenToCollection<T>(collectionPath: string, callback: (data: T[]) => void, constraints?: any[]): Unsubscribe {
        const resolvedPath = this.resolvePath(collectionPath);
        
        let isSubscribed = true;

        const fetchData = async () => {
            if (!isSubscribed || !this.userId) {
                callback([]); // If not subscribed or user logs out, clear data.
                return;
            };
            try {
                const response = await fetch(getApiUrl(resolvedPath), { headers: await this.getAuthHeader() });
                if (response.ok) {
                    const data = await response.json();
                    if(isSubscribed) {
                        callback(data as T[]);
                    }
                } else if (response.status === 401) {
                    if(isSubscribed) {
                        console.warn(`Unauthorized listen on ${resolvedPath}. Logging out or session expired.`);
                        callback([]);
                    }
                }
            } catch (error) {
                console.error(`Fetch error for ${resolvedPath}:`, error);
                 if(isSubscribed) {
                    callback([]);
                }
            }
        };

        const intervalId = setInterval(fetchData, 15000); // Poll every 15 seconds

        fetchData();
        
        const unsubscribe = () => {
            isSubscribed = false;
            clearInterval(intervalId);
        };

        return unsubscribe;
    }

    async getDoc<T>(docPath: string): Promise<T | null> {
        const resolvedPath = this.resolvePath(docPath);
        const response = await fetch(getApiUrl(resolvedPath), { headers: await this.getAuthHeader() });
        if (!response.ok) {
            if (response.status === 401) return null;
            if (response.status === 404) return null;
            throw new Error(`Failed to get doc: ${await response.text()}`);
        }
        const data = await response.json();
        if (data && data._id) {
            data.id = data._id.toString();
            // For user profile, the uid is the same as the id.
            if(resolvedPath.startsWith('users/')) {
                data.uid = data._id.toString();
            }
            delete data._id;
        }
        return data;
    }
    
    async addDoc<T extends DocumentData>(collectionPath: string, data: T): Promise<string> {
        const resolvedPath = this.resolvePath(collectionPath);
        const response = await fetch(getApiUrl(resolvedPath), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(await this.getAuthHeader()) },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Failed to add doc: ${await response.text()}`);
        const { insertedId } = await response.json();
        return insertedId;
    }

    async setDoc<T extends DocumentData>(docPath: string, data: T): Promise<void> {
        const resolvedPath = this.resolvePath(docPath);
        const response = await fetch(getApiUrl(resolvedPath), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...(await this.getAuthHeader()) },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Failed to set doc: ${await response.text()}`);
    }

    async updateDoc(docPath: string, data: Partial<DocumentData>): Promise<void> {
         const resolvedPath = this.resolvePath(docPath);
         const response = await fetch(getApiUrl(resolvedPath), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...(await this.getAuthHeader()) },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Failed to update doc: ${await response.text()}`);
    }

    async deleteDoc(docPath: string): Promise<void> {
        const resolvedPath = this.resolvePath(docPath);
        const response = await fetch(getApiUrl(resolvedPath), {
            method: 'DELETE',
            headers: await this.getAuthHeader()
        });
        if (!response.ok && response.status !== 204) throw new Error(`Failed to delete doc: ${await response.text()}`);
    }
    
    async runTransaction(updateFunction: (transaction: any) => Promise<any>): Promise<any> {
       console.warn("MongoDbAdapter: Client-side transactions are not supported. Operations must be atomic API endpoints.");
       throw new Error("Transactions not implemented for MongoDB adapter on the client-side.");
    }

    increment(value: number): any {
       return { __op: 'Increment', value };
    }

    queryConstraint(type: 'orderBy' | 'where' | 'limit', field: string, operator: any, value?: any): any {
      console.warn("MongoDbAdapter: Query constraints must be implemented via API query parameters and are not yet supported in this adapter.");
      return {};
    }
}

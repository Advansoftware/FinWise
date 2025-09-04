// src/services/database/mongodb-adapter.ts

import { DocumentData } from "firebase/firestore";
import { IDatabaseAdapter, Unsubscribe } from "./database-adapter";

// Helper to construct API URL
const getApiUrl = (path: string, userId?: string | null) => {
    // For collections that are user-specific but not nested in the URL structure (like settings)
    if (path.includes('USER_ID') && userId) {
        return `/api/data/${path.replace('USER_ID', userId)}`;
    }
    // For direct user document access or nested collections
    if (userId) {
        return `/api/data/${path}/${userId}`;
    }
    return `/api/data/${path}`;
};


export class MongoDbAdapter implements IDatabaseAdapter {
    private async getAuthHeaderAndUserId(): Promise<{ headers: Record<string, string>, userId: string | null }> {
        // This is a placeholder for a real auth token retrieval method
        // In a real app, this would get the session token (e.g., JWT)
        // For this context, we will assume the API route handles authorization
        // based on a secure session mechanism (e.g., httpOnly cookie)
        const response = await fetch('/api/auth/session'); // Dummy endpoint to get session info
        if (response.ok) {
            const { userId, token } = await response.json();
            return {
                headers: { 'Authorization': `Bearer ${token}` },
                userId,
            };
        }
        return { headers: {}, userId: null };
    }
    
    private resolvePath(path: string, userId: string | null): string {
        if (userId) {
            return path.replace('USER_ID', userId);
        }
        // If no user, it's likely a path that doesn't need it, or it will fail at the API level
        return path;
    }

    listenToCollection<T>(collectionPath: string, callback: (data: T[]) => void, constraints?: any[], token?: string, userId?: string): Unsubscribe {
        const resolvedPath = this.resolvePath(collectionPath, userId || null);
        
        let isSubscribed = true;

        const fetchData = async () => {
            if (!isSubscribed || !userId) {
                callback([]); // If not subscribed or user logs out, clear data.
                return;
            };
            try {
                const response = await fetch(getApiUrl(resolvedPath), { headers: { 'Authorization': `Bearer ${token}` } });
                if (response.ok) {
                    const data = await response.json();
                    if(isSubscribed) {
                        callback(data.map((d: any) => ({...d, id: d._id.toString(), uid: d._id.toString()})) as T[]);
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

    async getDoc<T>(docPath: string, token?: string, userId?: string): Promise<T | null> {
        const resolvedPath = this.resolvePath(docPath, userId || null);
        const apiUrl = docPath.startsWith('users/') ? `/api/data/${resolvedPath}` : getApiUrl(docPath, userId);
        
        const response = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) {
            if (response.status === 401) {
                 console.error(`Unauthorized GET on ${apiUrl}`);
                 return null;
            }
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
    
    async addDoc<T extends DocumentData>(collectionPath: string, data: T, token?: string, userId?: string): Promise<string> {
        const resolvedPath = this.resolvePath(collectionPath, userId || null);
        const response = await fetch(getApiUrl(resolvedPath), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Failed to add doc: ${await response.text()}`);
        const { insertedId } = await response.json();
        return insertedId;
    }

    async setDoc<T extends DocumentData>(docPath: string, data: T, token?: string, userId?: string): Promise<void> {
        const resolvedPath = this.resolvePath(docPath, userId || null);
        const apiUrl = docPath.startsWith('users/') ? `/api/data/${resolvedPath}` : getApiUrl(docPath, userId);

        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Failed to set doc: ${await response.text()}`);
    }

    async updateDoc(docPath: string, data: Partial<DocumentData>, token?: string, userId?: string): Promise<void> {
         const resolvedPath = this.resolvePath(docPath, userId || null);
         const apiUrl = docPath.startsWith('users/') ? `/api/data/${resolvedPath}` : getApiUrl(docPath, userId);
         const response = await fetch(apiUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Failed to update doc: ${await response.text()}`);
    }

    async deleteDoc(docPath: string, token?: string, userId?: string): Promise<void> {
        const resolvedPath = this.resolvePath(docPath, userId || null);
        const apiUrl = docPath.startsWith('users/') ? `/api/data/${resolvedPath}` : getApiUrl(docPath, userId);
        const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
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

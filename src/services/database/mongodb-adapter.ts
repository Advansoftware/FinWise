// src/services/database/mongodb-adapter.ts

import { DocumentData } from "firebase/firestore";
import { IDatabaseAdapter, Unsubscribe } from "./database-adapter";
import { getAuthAdapter } from "../auth/auth-service";

// Helper to construct API URL, ensuring userId is always a query parameter.
const getApiUrl = (path: string, userId: string): string => {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    let baseUrl = `/api/data/${cleanPath}`;
    
    // Add the userId as a query parameter.
    const separator = baseUrl.includes('?') ? '&' : '?';
    baseUrl = `${baseUrl}${separator}userId=${userId}`;

    return baseUrl;
};


export class MongoDbAdapter implements IDatabaseAdapter {
    private authAdapter;

    constructor() {
        // Use the auth adapter to get the current user's token/ID
        this.authAdapter = getAuthAdapter();
    }
    
    private async getHeaders(): Promise<Record<string, string>> {
        // The token from our mongo adapter is now just the UID, which is not a secure verifier.
        // The security comes from the fact that we are in the user's browser, and we get the UID from the session.
        // The backend should not (and will not) trust this header for authentication.
        // It's sent for consistency, but the backend must ignore it.
        const token = await this.authAdapter.getToken();
        return {
            'Content-Type': 'application/json',
             // We'll send the UID as a pseudo-token, but the backend won't use it for verification.
            'Authorization': `Bearer ${token || ''}`
        };
    }
    
     private async resolvePath(path: string): Promise<{resolvedPath: string, userId: string | null}> {
        const userId = await this.authAdapter.getToken();
        if (userId) {
            return { resolvedPath: path.replace(/USER_ID/g, userId), userId };
        }
        return { resolvedPath: path, userId: null };
    }


    listenToCollection<T>(collectionPath: string, callback: (data: T[]) => void, constraints?: any[]): Unsubscribe {
        let isSubscribed = true;

        const fetchData = async () => {
            if (!isSubscribed) return;
            
            const { userId } = await this.resolvePath(collectionPath);
            if(!userId) {
                 if (isSubscribed) callback([]);
                 return;
            }

            try {
                const headers = await this.getHeaders();
                const apiUrl = getApiUrl(collectionPath, userId);

                const response = await fetch(apiUrl, { headers });
                
                if (response.ok) {
                    const data = await response.json();
                    if(isSubscribed) {
                        callback(data.map((d: any) => ({...d, id: d._id.toString() })) as T[]);
                    }
                } else {
                     if(isSubscribed && response.status !== 401) {
                        console.warn(`Listen failed on ${collectionPath} with status ${response.status}.`);
                        callback([]);
                    }
                }
            } catch (error) {
                if(isSubscribed) {
                   console.error(`Fetch error for ${collectionPath}:`, error);
                   callback([]);
                }
            }
        };

        const intervalId = setInterval(fetchData, 5000); 
        fetchData();
        
        const unsubscribe = () => {
            isSubscribed = false;
            clearInterval(intervalId);
        };

        return unsubscribe;
    }

    async getDoc<T>(docPath: string): Promise<T | null> {
        const { resolvedPath, userId } = await this.resolvePath(docPath);
        if (!userId) return null;
        
        const headers = await this.getHeaders();
        const apiUrl = getApiUrl(resolvedPath, userId);
        const response = await fetch(apiUrl, { headers });
        
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`Failed to get doc: ${await response.text()}`);
        }
        const data = await response.json();
        if (data && data._id) {
            data.id = data._id.toString();
            if(docPath.startsWith('users/')) {
                data.uid = data.id;
            }
            delete data._id;
        }
        return data;
    }
    
    async addDoc<T extends DocumentData>(collectionPath: string, data: T): Promise<string> {
        const { userId } = await this.resolvePath(collectionPath);
        if (!userId) throw new Error("User not authenticated");

        const headers = await this.getHeaders();
        const apiUrl = getApiUrl(collectionPath, userId);
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Failed to add doc: ${await response.text()}`);
        const { insertedId } = await response.json();
        return insertedId;
    }

    async setDoc<T extends DocumentData>(docPath: string, data: T): Promise<void> {
        const { resolvedPath, userId } = await this.resolvePath(docPath);
        if (!userId) throw new Error("User not authenticated");

        const headers = await this.getHeaders();
        const apiUrl = getApiUrl(resolvedPath, userId);
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
             const errorText = await response.text();
             console.error("Failed to set doc:", errorText);
             throw new Error(`Failed to set doc: ${errorText}`);
        }
    }

    async updateDoc(docPath: string, data: Partial<DocumentData>): Promise<void> {
         const { resolvedPath, userId } = await this.resolvePath(docPath);
         if (!userId) throw new Error("User not authenticated");

         const headers = await this.getHeaders();
         const apiUrl = getApiUrl(resolvedPath, userId);
         const response = await fetch(apiUrl, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Failed to update doc: ${await response.text()}`);
    }

    async deleteDoc(docPath: string): Promise<void> {
        const { resolvedPath, userId } = await this.resolvePath(docPath);
        if (!userId) throw new Error("User not authenticated");
        
        const headers = await this.getHeaders();
        const apiUrl = getApiUrl(resolvedPath, userId);
        const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers
        });
        if (!response.ok && response.status !== 204) throw new Error(`Failed to delete doc: ${await response.text()}`);
    }
    
    async runTransaction(updateFunction: (transaction: any) => Promise<any>): Promise<any> {
       console.warn("MongoDbAdapter: Client-side transactions are not supported. Operations must be atomic API endpoints.");
       throw new Error("Transactions not implemented for MongoDB adapter on the client-side.");
    }

    increment(value: number): any {
       // This will be handled by the backend API route using $inc
       return { '$inc': { balance: value } }; 
    }

    queryConstraint(type: 'orderBy' | 'where' | 'limit', field: string, operator: any, value?: any): any {
      console.warn("MongoDbAdapter: Query constraints must be implemented via API query parameters and are not yet supported in this adapter.");
      return {};
    }
}

// src/services/database/mongodb-adapter.ts

import { DocumentData } from "firebase/firestore";
import { IDatabaseAdapter, Unsubscribe } from "./database-adapter";
import { getFirebase } from "@/lib/firebase";
import { Auth } from "firebase/auth";

// Helper to construct API URL, ensuring userId is always a query parameter.
const getApiUrl = (path: string, userId: string) => {
    // This function now expects the userId to be explicitly passed.
    // It will be added as a query parameter to all requests.
    const baseUrl = `/api/data/${path}`;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}userId=${userId}`;
};


export class MongoDbAdapter implements IDatabaseAdapter {
    private auth: Auth;

    constructor() {
        const { auth } = getFirebase();
        this.auth = auth;
    }
    
    private async getHeaders(): Promise<Record<string, string>> {
        if (!this.auth.currentUser) {
            throw new Error("User not authenticated to make API requests.");
        }
        // Force refresh the token to ensure we are sending a valid ID token,
        // not the initial custom token. This is crucial for the backend verification.
        const token = await this.auth.currentUser.getIdToken(true);
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    listenToCollection<T>(collectionPath: string, callback: (data: T[]) => void, constraints?: any[]): Unsubscribe {
        let isSubscribed = true;

        const fetchData = async () => {
            if (!isSubscribed || !this.auth.currentUser) {
                if (isSubscribed) callback([]); 
                return;
            };

            try {
                const headers = await this.getHeaders();
                // Pass the current user's UID to get the correct data
                const apiUrl = getApiUrl(collectionPath, this.auth.currentUser.uid);

                const response = await fetch(apiUrl, { headers });
                
                if (response.ok) {
                    const data = await response.json();
                    if(isSubscribed) {
                        callback(data.map((d: any) => ({...d, id: d._id.toString() })) as T[]);
                    }
                } else {
                     if(isSubscribed) {
                        console.warn(`Listen failed on ${collectionPath} with status ${response.status}.`);
                        callback([]);
                    }
                }
            } catch (error) {
                console.error(`Fetch error for ${collectionPath}:`, error);
                 if(isSubscribed) {
                    callback([]);
                }
            }
        };

        const intervalId = setInterval(fetchData, 5000); 

        // Initial fetch
        fetchData();
        
        const unsubscribe = () => {
            isSubscribed = false;
            clearInterval(intervalId);
        };

        return unsubscribe;
    }

    async getDoc<T>(docPath: string): Promise<T | null> {
        if (!this.auth.currentUser) return null;
        const headers = await this.getHeaders();
        // Pass the user's UID to authorize the request
        const apiUrl = getApiUrl(docPath, this.auth.currentUser.uid);
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
        if (!this.auth.currentUser) throw new Error("User not authenticated");
        const headers = await this.getHeaders();
        const apiUrl = getApiUrl(collectionPath, this.auth.currentUser.uid);
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
        if (!this.auth.currentUser) throw new Error("User not authenticated");
        const headers = await this.getHeaders();
        const apiUrl = getApiUrl(docPath, this.auth.currentUser.uid);
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Failed to set doc: ${await response.text()}`);
    }

    async updateDoc(docPath: string, data: Partial<DocumentData>): Promise<void> {
         if (!this.auth.currentUser) throw new Error("User not authenticated");
         const headers = await this.getHeaders();
         const apiUrl = getApiUrl(docPath, this.auth.currentUser.uid);
         const response = await fetch(apiUrl, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Failed to update doc: ${await response.text()}`);
    }

    async deleteDoc(docPath: string): Promise<void> {
        if (!this.auth.currentUser) throw new Error("User not authenticated");
        const headers = await this.getHeaders();
        const apiUrl = getApiUrl(docPath, this.auth.currentUser.uid);
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
       return { __op: 'Increment', value };
    }

    queryConstraint(type: 'orderBy' | 'where' | 'limit', field: string, operator: any, value?: any): any {
      console.warn("MongoDbAdapter: Query constraints must be implemented via API query parameters and are not yet supported in this adapter.");
      return {};
    }
}

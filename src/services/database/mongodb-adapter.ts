
// src/services/database/mongodb-adapter.ts

import { DocumentData } from "firebase/firestore";
import { IDatabaseAdapter, Unsubscribe } from "./database-adapter";
import { getFirebase } from "@/lib/firebase";
import { Auth } from "firebase/auth";

// Helper to construct API URL, ensuring userId is always a query parameter.
const getApiUrl = (path: string, userId: string): string => {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    let baseUrl = `/api/data/${cleanPath}`;
    
    // Add the userId as a query parameter.
    // This simplifies the backend logic to always expect the userId in the query.
    const separator = baseUrl.includes('?') ? '&' : '?';
    baseUrl = `${baseUrl}${separator}userId=${userId}`;

    return baseUrl;
};


export class MongoDbAdapter implements IDatabaseAdapter {
    private auth: Auth;

    constructor() {
        const { auth } = getFirebase();
        this.auth = auth;
    }
    
    private async getHeaders(): Promise<Record<string, string>> {
        // This function is now the gatekeeper. It ensures we don't proceed without a valid ID token.
        if (!this.auth.currentUser) {
            // This is a race condition scenario. We wait for a short period for the user state to propagate.
            // A more robust solution might involve an event emitter or a state manager promise.
            await new Promise<void>(resolve => {
                const unsubscribe = this.auth.onIdTokenChanged(user => {
                    if (user) {
                        unsubscribe();
                        resolve();
                    }
                });
            });
        }
        
        if (!this.auth.currentUser) {
            throw new Error("User not authenticated. Cannot make API requests.");
        }
        
        // Force refresh the token to ensure we are sending a valid ID token, not a custom token.
        const token = await this.auth.currentUser.getIdToken(true);
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }
    
     private resolvePath(path: string): string {
        const userId = this.auth.currentUser?.uid;
        if (userId) {
            return path.replace(/USER_ID/g, userId);
        }
        // The getHeaders method will throw before this becomes a problem in most cases.
        return path;
    }


    listenToCollection<T>(collectionPath: string, callback: (data: T[]) => void, constraints?: any[]): Unsubscribe {
        let isSubscribed = true;

        const fetchData = async () => {
            if (!isSubscribed || !this.auth.currentUser) {
                if (isSubscribed) callback([]); 
                return;
            };

            try {
                const resolvedPath = this.resolvePath(collectionPath);
                const headers = await this.getHeaders();
                const apiUrl = getApiUrl(resolvedPath, this.auth.currentUser.uid);

                const response = await fetch(apiUrl, { headers });
                
                if (response.ok) {
                    const data = await response.json();
                    if(isSubscribed) {
                        callback(data.map((d: any) => ({...d, id: d._id.toString() })) as T[]);
                    }
                } else {
                     if(isSubscribed && response.status !== 401) { // Don't warn on auth errors during logout
                        console.warn(`Listen failed on ${resolvedPath} with status ${response.status}.`);
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
         if (!this.auth.currentUser) {
             console.warn("getDoc called before user was authenticated. This may lead to a race condition.");
             await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for auth state
             if (!this.auth.currentUser) return null;
        };
        
        const resolvedPath = this.resolvePath(docPath);
        const headers = await this.getHeaders();
        const apiUrl = getApiUrl(resolvedPath, this.auth.currentUser.uid);
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
        const resolvedPath = this.resolvePath(collectionPath);
        const headers = await this.getHeaders();
        if (!this.auth.currentUser) throw new Error("User not authenticated");
        
        const apiUrl = getApiUrl(resolvedPath, this.auth.currentUser.uid);
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
        const resolvedPath = this.resolvePath(docPath);
        const headers = await this.getHeaders();
         if (!this.auth.currentUser) throw new Error("User not authenticated");

        const apiUrl = getApiUrl(resolvedPath, this.auth.currentUser.uid);
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
         const resolvedPath = this.resolvePath(docPath);
         const headers = await this.getHeaders();
         if (!this.auth.currentUser) throw new Error("User not authenticated");

         const apiUrl = getApiUrl(resolvedPath, this.auth.currentUser.uid);
         const response = await fetch(apiUrl, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Failed to update doc: ${await response.text()}`);
    }

    async deleteDoc(docPath: string): Promise<void> {
        const resolvedPath = this.resolvePath(docPath);
        const headers = await this.getHeaders();
        if (!this.auth.currentUser) throw new Error("User not authenticated");
        
        const apiUrl = getApiUrl(resolvedPath, this.auth.currentUser.uid);
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

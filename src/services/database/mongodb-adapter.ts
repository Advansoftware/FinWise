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
    const separator = baseUrl.includes('?') ? '&' : '?';
    baseUrl = `${baseUrl}${separator}userId=${userId}`;

    return baseUrl;
};


export class MongoDbAdapter implements IDatabaseAdapter {
    private auth: Auth;
    private authStatePromise: Promise<void>;
    private resolveAuthState: () => void = () => {};

    constructor() {
        const { auth } = getFirebase();
        this.auth = auth;
        
        this.authStatePromise = new Promise(resolve => {
            this.resolveAuthState = resolve;
        });

        this.auth.onIdTokenChanged(user => {
            if (user) {
                this.resolveAuthState();
            } else {
                // Reset promise if user logs out
                this.authStatePromise = new Promise(resolve => {
                    this.resolveAuthState = resolve;
                });
            }
        });
    }
    
    private async getHeaders(): Promise<Record<string, string>> {
        // Wait until the auth state has been resolved.
        await this.authStatePromise;
        
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
        // This should theoretically not be reached if getHeaders() is awaited,
        // but it's a safe fallback.
        return path;
    }


    listenToCollection<T>(collectionPath: string, callback: (data: T[]) => void, constraints?: any[]): Unsubscribe {
        let isSubscribed = true;

        const fetchData = async () => {
            if (!isSubscribed) return;
            
            // Wait for auth to be ready before fetching
            await this.authStatePromise;
            if(!this.auth.currentUser) {
                 if (isSubscribed) callback([]);
                 return;
            }

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
                     if(isSubscribed && response.status !== 401) {
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
        await this.authStatePromise;
        if (!this.auth.currentUser) return null;
        
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

// src/services/database/firebase-adapter.ts

import { getFirebase } from "@/lib/firebase";
import { 
    collection, 
    doc, 
    onSnapshot, 
    addDoc as fbAddDoc,
    setDoc as fbSetDoc,
    getDoc as fbGetDoc,
    updateDoc as fbUpdateDoc,
    deleteDoc as fbDeleteDoc,
    runTransaction as fbRunTransaction,
    increment as fbIncrement,
    DocumentData,
    QueryConstraint as FirebaseQueryConstraint,
    query,
    Timestamp,
    orderBy,
    where,
    limit,
    WhereFilterOp,
    OrderByDirection,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { IDatabaseAdapter, Unsubscribe } from "./database-adapter";
import { UserProfile } from "@/lib/types";

export class FirebaseAdapter implements IDatabaseAdapter {
    private db;
    private auth;

    constructor() {
        const { db, auth } = getFirebase();
        this.db = db;
        this.auth = auth;
    }

    private getUserId(): string | undefined {
        return this.auth.currentUser?.uid;
    }
    
    private serializeData(data: DocumentData): DocumentData {
        const serialized: DocumentData = {};
        for (const key in data) {
            const value = data[key];
            if (value instanceof Date) {
                serialized[key] = Timestamp.fromDate(value);
            } else if (value !== undefined) {
                serialized[key] = value;
            }
        }
        return serialized;
    }

    listenToCollection<T>(collectionPath: string, callback: (data: T[]) => void, constraints: FirebaseQueryConstraint[] = []): Unsubscribe {
        const userId = this.getUserId();
        if (!userId) {
            callback([]);
            return () => {};
        }

        try {
            const finalConstraints = [where('userId', '==', userId), ...constraints];
            const q = query(collection(this.db, collectionPath), ...finalConstraints);

            return onSnapshot(q, (querySnapshot) => {
                const data: T[] = [];
                querySnapshot.forEach((doc) => {
                    const docData = doc.data();
                     Object.keys(docData).forEach(key => {
                        if (docData[key] instanceof Timestamp) {
                            docData[key] = docData[key].toDate().toISOString();
                        }
                    });
                    data.push({ id: doc.id, ...docData } as T);
                });
                callback(data);
            }, (error) => {
                console.error(`Firebase listener error on path ${collectionPath}:`, error);
                callback([]); // Return empty array on error
            });
        } catch (error) {
            console.error("Failed to attach listener:", error);
            return () => {};
        }
    }

    async getDoc<T>(docPath: string): Promise<T | null> {
        const userId = this.getUserId();
        
        const docRef = doc(this.db, docPath);
        const docSnap = await fbGetDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Security check for sub-collections, requires a userId to be present on doc
            if (userId && data.userId && data.userId !== userId) {
                 console.warn(`Permission denied: User ${userId} tried to access doc ${docPath} owned by ${data.userId}`);
                 return null;
            }
             // Security check for top-level user doc
            if (userId && docPath.startsWith('users/') && docSnap.id !== userId) {
                 console.warn(`Permission denied: User ${userId} tried to access user doc ${docPath}`);
                return null;
            }

            Object.keys(data).forEach(key => {
                if (data[key] instanceof Timestamp) {
                    data[key] = data[key].toDate().toISOString();
                }
            });
            
            const docId = docSnap.id;
            const finalData = { ...data, id: docId };
            // For user profile, ensure 'uid' field is consistent with other adapters
            if (docPath.startsWith('users/')) {
                (finalData as any).uid = docId;
            }

            return finalData as T;
        }
        return null;
    }

    async addDoc<T extends DocumentData>(collectionPath: string, data: T): Promise<string> {
        const userId = this.getUserId();
        if (!userId) throw new Error("User not authenticated");

        const dataWithUser = { ...data, userId };
        const serializedData = this.serializeData(dataWithUser);
        const docRef = await fbAddDoc(collection(this.db, collectionPath), serializedData);
        return docRef.id;
    }

    async setDoc<T extends DocumentData>(docPath: string, data: T): Promise<void> {
        const userId = this.getUserId();
        // Allow setting doc even if user is not authenticated for initial user profile creation
        const dataWithUser = userId ? { ...data, userId } : data;
        const serializedData = this.serializeData(dataWithUser);
        await fbSetDoc(doc(this.db, docPath), serializedData, { merge: true });
    }

    async updateDoc(docPath: string, data: Partial<DocumentData>): Promise<void> {
        // Security: We trust Firestore rules to enforce ownership on update
        const serializedData = this.serializeData(data);
        await fbUpdateDoc(doc(this.db, docPath), serializedData);
    }
    
    async deleteDoc(docPath: string): Promise<void> {
        // Security: We trust Firestore rules to enforce ownership on delete
        await fbDeleteDoc(doc(this.db, docPath));
    }

    async runTransaction(updateFunction: (transaction: any) => Promise<any>): Promise<any> {
        return await fbRunTransaction(this.db, async (firebaseTransaction) => {
            const wrappedTransaction = {
                get: (docPath: string) => {
                    return firebaseTransaction.get(doc(this.db, docPath));
                },
                set: (docPath: string, data: DocumentData) => {
                    const serializedData = this.serializeData(data);
                    return firebaseTransaction.set(doc(this.db, docPath), serializedData);
                },
                update: (docPath: string, data: Partial<DocumentData>) => {
                     const serializedData = this.serializeData(data);
                     return firebaseTransaction.update(doc(this.db, docPath), serializedData);
                },
                delete: (docPath: string) => {
                     return firebaseTransaction.delete(doc(this.db, docPath));
                }
            };
            return updateFunction(wrappedTransaction);
        });
    }

    increment(value: number): any {
        return fbIncrement(value);
    }

    queryConstraint(type: 'orderBy', field: string, direction: OrderByDirection): FirebaseQueryConstraint;
    queryConstraint(type: 'where', field: string, operator: WhereFilterOp, value: any): FirebaseQueryConstraint;
    queryConstraint(type: any, field: any, operator: any, value?: any): FirebaseQueryConstraint {
        if (type === 'orderBy') {
            return orderBy(field, operator);
        }
        if (type === 'where') {
            return where(field, operator, value);
        }
        throw new Error(`Unsupported constraint type: ${type}`);
    }
}


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

    private getUserId(): string {
        const currentUserId = this.auth.currentUser?.uid;
        if (!currentUserId) {
            throw new Error("User not authenticated for Firebase operations");
        }
        return currentUserId;
    }

    private resolvePath(path: string): string {
        if (this.auth.currentUser) {
            return path.replace('USER_ID', this.getUserId());
        }
        return path;
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
        try {
            const resolvedPath = this.resolvePath(collectionPath);
            const q = query(collection(this.db, resolvedPath), ...constraints);

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
                console.error(`Firebase listener error on path ${resolvedPath}:`, error);
                callback([]); // Return empty array on error
            });
        } catch (error) {
            console.error("Failed to attach listener:", error);
            return () => {};
        }
    }

    async getDoc<T>(docPath: string): Promise<T | null> {
        const resolvedPath = this.resolvePath(docPath);
        const docRef = doc(this.db, resolvedPath);
        const docSnap = await fbGetDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            Object.keys(data).forEach(key => {
                if (data[key] instanceof Timestamp) {
                    data[key] = data[key].toDate().toISOString();
                }
            });
            // For user profile, the uid is the same as the id.
            if(resolvedPath.startsWith('users/')) {
                return { id: docSnap.id, uid: docSnap.id, ...data } as T;
            }
            return { id: docSnap.id, ...data } as T;
        }
        return null;
    }

    async addDoc<T extends DocumentData>(collectionPath: string, data: T): Promise<string> {
        const resolvedPath = this.resolvePath(collectionPath);
        const serializedData = this.serializeData(data);
        const docRef = await fbAddDoc(collection(this.db, resolvedPath), serializedData);
        return docRef.id;
    }

    async setDoc<T extends DocumentData>(docPath: string, data: T): Promise<void> {
        const resolvedPath = this.resolvePath(docPath);
        const serializedData = this.serializeData(data);
        await fbSetDoc(doc(this.db, resolvedPath), serializedData, { merge: true });
    }

    async updateDoc(docPath: string, data: Partial<DocumentData>): Promise<void> {
        const resolvedPath = this.resolvePath(docPath);
        const serializedData = this.serializeData(data);
        await fbUpdateDoc(doc(this.db, resolvedPath), serializedData);
    }
    
    async deleteDoc(docPath: string): Promise<void> {
        const resolvedPath = this.resolvePath(docPath);
        await fbDeleteDoc(doc(this.db, resolvedPath));
    }

    async runTransaction(updateFunction: (transaction: any) => Promise<any>): Promise<any> {
        return await fbRunTransaction(this.db, async (firebaseTransaction) => {
            const wrappedTransaction = {
                get: (docPath: string) => {
                    const resolvedPath = this.resolvePath(docPath);
                    return firebaseTransaction.get(doc(this.db, resolvedPath));
                },
                set: (docPath: string, data: DocumentData) => {
                    const resolvedPath = this.resolvePath(docPath);
                    const serializedData = this.serializeData(data);
                    return firebaseTransaction.set(doc(this.db, resolvedPath), serializedData);
                },
                update: (docPath: string, data: Partial<DocumentData>) => {
                     const resolvedPath = this.resolvePath(docPath);
                     const serializedData = this.serializeData(data);
                     return firebaseTransaction.update(doc(this.db, resolvedPath), serializedData);
                },
                delete: (docPath: string) => {
                     const resolvedPath = this.resolvePath(docPath);
                     return firebaseTransaction.delete(doc(this.db, resolvedPath));
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

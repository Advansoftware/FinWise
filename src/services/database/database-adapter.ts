// src/services/database/database-adapter.ts

import { DocumentData } from "firebase/firestore";
import { User } from "firebase/auth";

export type Unsubscribe = () => void;
export type QueryConstraint = {
    type: 'where' | 'orderBy' | 'limit';
    field?: string;
    operator?: string;
    value?: any;
    direction?: 'asc' | 'desc';
};


/**
 * Interface (Port) for the Database Adapter.
 * Defines the contract that any data persistence implementation must follow.
 */
export interface IDatabaseAdapter {
    /**
     * Listens for real-time updates on a collection.
     * @param collectionPath The path to the collection.
     * @param callback A function to be called with the new data.
     * @param constraints Optional query constraints.
     * @returns An unsubscribe function.
     */
    listenToCollection<T>(
        collectionPath: string,
        callback: (data: T[]) => void,
        constraints?: any[] // Type any to support different lib constraints
    ): Unsubscribe;

    /**
     * Gets a single document from a collection.
     * @param docPath The path to the document.
     * @returns The document data or null if not found.
     */
    getDoc<T>(docPath: string): Promise<T | null>;
    
    /**
     * Checks if a user profile exists and creates it if it doesn't.
     * This is crucial for synchronizing auth users with database profiles.
     * @param user The user object from the authentication provider.
     */
    ensureUserProfile(user: User): Promise<void>;

    /**
     * Adds a new document to a collection.
     * @param collectionPath The path to the collection.
     * @param data The data to add.
     * @returns The ID of the newly created document.
     */
    addDoc<T extends DocumentData>(collectionPath: string, data: T): Promise<string>;

    /**
     * Creates or overwrites a single document.
     * @param docPath The path to the document.
     * @param data The data to set.
     */
    setDoc<T extends DocumentData>(docPath: string, data: T): Promise<void>;

     /**
     * Updates a document.
     * @param docPath The path to the document.
     * @param data The data to update.
     */
    updateDoc(docPath: string, data: Partial<DocumentData>): Promise<void>;

    /**
     * Deletes a document.
     * @param docPath The path to the document.
     */
    deleteDoc(docPath: string): Promise<void>;

    /**
     * Executes a transaction.
     * @param updateFunction The function that executes the transaction logic.
     */
    runTransaction(updateFunction: (transaction: any) => Promise<any>): Promise<any>;

    /**
     * A way to represent an increment operation for numeric fields.
     * @param value The value to increment by (can be negative).
     */
    increment(value: number): any;
    
    /**
     * A way to represent a query constraint.
     */
    queryConstraint(type: 'orderBy', field: string, direction: 'asc' | 'desc'): any;
    queryConstraint(type: 'where', field: string, operator: any, value: any): any;
}

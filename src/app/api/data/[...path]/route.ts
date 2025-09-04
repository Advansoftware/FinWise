
// src/app/api/data/[...path]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAdminApp } from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';

async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const idToken = authHeader.split('Bearer ')[1];
    try {
        // Use verifyIdToken WITHOUT the second parameter. This correctly verifies
        // the ID token from the client SDK, not a custom token.
        const decodedToken = await getAdminApp().auth().verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying ID token:", error);
        return null;
    }
}


async function handler(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    const { db } = await connectToDatabase();
    
    // Step 1: Always verify the token first
    const authenticatedUserId = await getUserIdFromToken(request);
    if (!authenticatedUserId) {
        return NextResponse.json({ error: 'Unauthorized: Invalid or missing token' }, { status: 401 });
    }

    // Step 2: Get the user ID from the query string. The client adapter MUST send it.
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');

    // Security check: The userId from the query MUST match the token's userId
    if (!queryUserId || queryUserId !== authenticatedUserId) {
         return NextResponse.json({ error: 'Unauthorized: User ID mismatch or missing.' }, { status: 403 });
    }
    
    const [collectionName, docId] = params.path;
    const collection = db.collection(collectionName);
    
    try {
        let query: any = {};
        
        // Security layer: Ensure the query always filters by the authenticated user's ID,
        // or for the 'users' collection, that the docId IS the authenticated user's ID.
        if (collectionName === 'users') {
             // For the 'users' collection, a user can only access their own document.
            if (docId !== authenticatedUserId) {
                return NextResponse.json({ error: 'Permission denied to access other user data' }, { status: 403 });
            }
             try {
                query._id = new ObjectId(docId);
            } catch (e) {
                // If the ID is not a valid ObjectId (like in Firebase), use it as is.
                query._id = docId;
            }
        } else {
            // For all other collections, the query must be scoped to the user.
            query.userId = authenticatedUserId;
            if (docId) { 
                try {
                   query._id = new ObjectId(docId);
                } catch(e) {
                     query._id = docId;
                }
            }
        }

        if (request.method === 'GET') {
            if (docId) { // Single document request
                const item = await collection.findOne(query);
                if (!item) return NextResponse.json({ error: 'Not found or permission denied' }, { status: 404 });
                return NextResponse.json(item);
            } else { // Collection request
                const items = await collection.find({ userId: authenticatedUserId }).toArray();
                return NextResponse.json(items);
            }
        }

        if (request.method === 'POST') {
            const body = await request.json();
            const result = await collection.insertOne({ ...body, userId: authenticatedUserId, createdAt: new Date() });
            return NextResponse.json({ insertedId: result.insertedId }, { status: 201 });
        }

        if ((request.method === 'PUT' || request.method === 'PATCH') && docId) {
             const body = await request.json();
             // Ensure the update does not change the userId
             delete body.userId;
             delete body.uid;
             delete body._id;
             delete body.id;

             const updateOps = request.method === 'PUT' ? { $set: body } : { $set: body }; // Simplified for now
           
            const result = await collection.updateOne(query, updateOps);
            if (result.matchedCount === 0) return NextResponse.json({ error: 'Not found or permission denied' }, { status: 404 });
            return NextResponse.json({ success: true });
        }

        if (request.method === 'DELETE' && docId) {
            const result = await collection.deleteOne(query);
            if (result.deletedCount === 0) return NextResponse.json({ error: 'Not found or permission denied' }, { status: 404 });
            return NextResponse.json({ success: true }, { status: 204 });
        }

        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    } catch (error: any) {
        console.error(`MongoDB Error on path ${params.path.join('/')}:`, error);
         if (error.name === 'BSONError' || (error.message && error.message.includes('Argument passed in must be a string'))) {
            return NextResponse.json({ error: 'Invalid document ID format' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };

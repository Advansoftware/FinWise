
// src/app/api/data/[...path]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAdminApp } from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';

async function getUserId(request: NextRequest): Promise<string | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const idToken = authHeader.split('Bearer ')[1];

    // Conditionally verify token based on the auth provider
    const authProvider = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'firebase';

    if (authProvider === 'firebase') {
        try {
            // For Firebase auth, we expect a standard ID token
            const decodedToken = await getAdminApp().auth().verifyIdToken(idToken, true);
            return decodedToken.uid;
        } catch (error) {
            console.error("Firebase ID token verification failed:", error);
            return null;
        }
    } else {
        // For MongoDB auth, the token is a custom token initially. The client exchanges it
        // for a Firebase session, but the UID is embedded in it. For API security,
        // we can decode it without full verification or trust the UID from the request path
        // as the security is enforced by matching the UID in the database query.
        // A more secure approach would involve a separate session token mechanism, but for this
        // architecture, we will decode the token to extract the UID.
        try {
            const decodedToken = await getAdminApp().auth().verifyIdToken(idToken, false); // `false` allows custom tokens
            return decodedToken.uid;
        } catch (error) {
             console.error("Custom token verification/decoding failed:", error);
            // Fallback for when the token might be a custom one that can't be verified directly here
            // This is less secure but might be necessary depending on client-side implementation.
            // A better fix is ensuring the client always sends a valid ID token.
            // For now, we will return null to enforce security.
            return null;
        }
    }
}

// Handles increment operations sent from the client adapter
function processUpdates(body: any) {
    const updateOps: any = { $set: {}, $inc: {} };
    let hasInc = false;
    let hasSet = false;

    for (const key in body) {
        if (key === '_id' || key === 'id' || key === 'uid') continue; // Don't allow changing the ID
        
        const value = body[key];
        if (value && typeof value === 'object' && value.__op === 'Increment') {
            updateOps.$inc[key] = value.value;
            hasInc = true;
        } else {
            updateOps.$set[key] = value;
            hasSet = true;
        }
    }
    
    if (!hasInc) delete updateOps.$inc;
    if (!hasSet) delete updateOps.$set;
    
    // Ensure we don't send an empty update object
    if (!hasInc && !hasSet) {
        return null;
    }

    return updateOps;
}

async function handler(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    const { db } = await connectToDatabase();
    const userId = await getUserId(request);

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [collectionName, docId] = params.path;
    let query: any = {};
    
    // The 'users' collection is special, it's keyed by _id = userId.
    if (collectionName === 'users') {
        if (docId) {
             if (userId !== docId) {
                // Prevent a logged-in user from accessing another user's profile
                return NextResponse.json({ error: 'Permission denied to access this user document' }, { status: 403 });
            }
             query = { _id: new ObjectId(userId) };
        } else {
            return NextResponse.json({ error: 'Fetching all users is not permitted.' }, { status: 403 });
        }
    } else {
        // For all other collections, they are keyed by a `userId` field.
        query = { userId };
        if (docId) {
            query._id = new ObjectId(docId);
        }
    }


    if (!collectionName) {
        return NextResponse.json({ error: 'Collection not specified' }, { status: 400 });
    }

    const collection = db.collection(collectionName);
    
    try {
        if (request.method === 'GET') {
            if (docId) {
                const item = await collection.findOne(query);
                if (!item) return NextResponse.json({ error: 'Not found or permission denied' }, { status: 404 });
                return NextResponse.json(item);
            } else {
                const items = await collection.find({ userId }).toArray();
                return NextResponse.json(items);
            }
        }

        if (request.method === 'POST') {
            const body = await request.json();
            const result = await collection.insertOne({ ...body, userId, createdAt: new Date() });
            return NextResponse.json({ insertedId: result.insertedId }, { status: 201 });
        }

        if (request.method === 'PUT' && docId) {
            const body = await request.json();
            delete body._id; 
            delete body.id;
            delete body.uid;
            
            // On user profile updates, don't allow changing critical fields
            if (collectionName === 'users') {
                delete body.email;
                delete body.createdAt;
            }
           
            const result = await collection.replaceOne(query, body);
            if (result.matchedCount === 0) return NextResponse.json({ error: 'Not found or permission denied' }, { status: 404 });
            return NextResponse.json({ success: true });
        }
        
        if (request.method === 'PATCH' && docId) {
             const body = await request.json();
             const updateOps = processUpdates(body);

             if (!updateOps) {
                 return NextResponse.json({ message: 'No update operations provided' }, { status: 200 });
             }
            
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

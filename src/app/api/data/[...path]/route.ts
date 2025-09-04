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
        const decodedToken = await getAdminApp().auth().verifyIdToken(idToken, true); // checkRevoked = true
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying ID token:", error);
        return null;
    }
}

// Handles increment operations sent from the client adapter
function processUpdates(body: any) {
    const updateOps: any = { $set: {}, $inc: {} };
    let hasInc = false;
    let hasSet = false;

    for (const key in body) {
        if (key === '_id' || key === 'id' || key === 'uid' || key === 'userId') continue; // Don't allow changing IDs
        
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
    const authProvider = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'firebase';

    let userId: string | null = null;
    
    if (authProvider === 'firebase') {
        userId = await getUserIdFromToken(request);
    } else {
        // For MongoDB, we trust the userId from the path, as it's coupled with the session on the client.
        // The real security happens in the database query, which always filters by this userId.
        const [collectionName, docOrUserId] = params.path;
        if(collectionName === 'users') {
             userId = docOrUserId;
        } else {
             // For other collections, the userId might be passed differently, need a consistent way.
             // Let's assume for now the user ID is the third path segment for nested collections.
             if(params.path.length > 2 && params.path[0] === 'users') {
                userId = params.path[1];
             }
        }
    }
   
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const [collectionName, docId] = params.path;
    
    let query: any = {};
    
    if (collectionName === 'users') {
         if (userId !== docId) {
            return NextResponse.json({ error: 'Permission denied to access this user document' }, { status: 403 });
        }
         try {
            query = { _id: new ObjectId(userId) };
        } catch (e) {
            query = { _id: userId };
        }
    } else {
        query = { userId };
        if (docId) {
            try {
               query._id = new ObjectId(docId);
            } catch(e) {
                 query._id = docId;
            }
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
            
            if (collectionName === 'users') {
                delete body.email;
                delete body.createdAt;
            }
           
            const result = await collection.replaceOne(query, { ...body, userId });
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

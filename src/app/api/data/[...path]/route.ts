// src/app/api/data/[...path]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAdminApp } from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';

async function getUserId(request: NextRequest): Promise<string | null> {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        try {
            const decodedToken = await getAdminApp().auth().verifyIdToken(idToken);
            return decodedToken.uid;
        } catch (error) {
            console.error("Error verifying Firebase ID token:", error);
            return null;
        }
    }
    return null;
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

    if (!collectionName) {
        return NextResponse.json({ error: 'Collection not specified' }, { status: 400 });
    }

    const collection = db.collection(collectionName);
    const query = { userId };
    
    try {
        if (request.method === 'GET') {
            if (docId) {
                const item = await collection.findOne({ _id: new ObjectId(docId), userId });
                if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
                return NextResponse.json(item);
            } else {
                const items = await collection.find(query).toArray();
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
            delete body._id; // Do not allow changing the id
            const result = await collection.replaceOne({ _id: new ObjectId(docId), userId }, { ...body, userId });
            if (result.matchedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            return NextResponse.json({ success: true });
        }
        
        if (request.method === 'PATCH' && docId) {
             const body = await request.json();
             const result = await collection.updateOne({ _id: new ObjectId(docId), userId }, body);
             if (result.matchedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
             return NextResponse.json({ success: true });
        }

        if (request.method === 'DELETE' && docId) {
            const result = await collection.deleteOne({ _id: new ObjectId(docId), userId });
            if (result.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            return NextResponse.json({ success: true }, { status: 204 });
        }

        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    } catch (error: any) {
        console.error(`MongoDB Error on path ${params.path.join('/')}:`, error);
         if (error.name === 'BSONError') {
            return NextResponse.json({ error: 'Invalid document ID format' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };

// src/app/api/data/[...path]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// This is a placeholder for a real session/token validation mechanism.
// In a production app, you would use a secure method like JWT or session cookies.
// For this self-contained example, we will trust the userId from the query params,
// as the user is already "logged in" on the client.
// This is NOT secure for a real-world application.
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    // Basic validation to ensure it looks like an ObjectId to prevent some bad requests
    if (userId && ObjectId.isValid(userId)) {
        return userId;
    }
    return null;
}


async function handler(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const authenticatedUserId = await getUserIdFromRequest(request);
    if (!authenticatedUserId) {
        return NextResponse.json({ error: 'Unauthorized: Invalid or missing user identifier.' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const [collectionName, docId] = path;

    // Redirect transactions operations to the specialized API
    if (collectionName === 'transactions') {
        const baseUrl = request.url.split('/api/data')[0];
        const searchParams = new URLSearchParams(request.url.split('?')[1] || '');
        searchParams.set('userId', authenticatedUserId);

        let targetUrl: string;
        if (docId) {
            targetUrl = `${baseUrl}/api/transactions/${docId}?${searchParams.toString()}`;
        } else {
            targetUrl = `${baseUrl}/api/transactions?${searchParams.toString()}`;
        }

        // Forward the request to the transactions API
        const forwardedRequest = new Request(targetUrl, {
            method: request.method,
            headers: request.headers,
            body: request.method !== 'GET' ? await request.text() : undefined,
        });

        return fetch(forwardedRequest);
    }

    const collection = db.collection(collectionName);

    try {
        let query: any = {};

        // When accessing the 'users' collection, the document ID must be the authenticated user's ID.
        if (collectionName === 'users') {
            if (docId !== authenticatedUserId) {
                return NextResponse.json({ error: 'Permission denied to access other user data' }, { status: 403 });
            }
            query._id = new ObjectId(docId);
        } else {
            // For all other collections, filter by the userId field.
            query.userId = authenticatedUserId;
            if (docId) {
                try {
                    query._id = new ObjectId(docId);
                } catch (e) {
                    return NextResponse.json({ error: 'Invalid document ID format' }, { status: 400 });
                }
            }
        }

        if (request.method === 'GET') {
            if (docId) {
                const item = await collection.findOne(query);
                if (!item) return NextResponse.json({ error: 'Not found or permission denied' }, { status: 404 });
                return NextResponse.json(item);
            } else {
                const items = await collection.find({ userId: authenticatedUserId }).toArray();
                return NextResponse.json(items);
            }
        }

        if (request.method === 'POST') {
            const body = await request.json();
            const docToInsert = { ...body, userId: authenticatedUserId, createdAt: new Date() };
            const result = await collection.insertOne(docToInsert);
            return NextResponse.json({ insertedId: result.insertedId }, { status: 201 });
        }

        if ((request.method === 'PUT' || request.method === 'PATCH') && docId) {
            const body = await request.json();
            delete body.userId; // Prevent user from changing ownership
            delete body._id;

            const result = await collection.updateOne(query, { $set: body });
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
        console.error(`MongoDB Error on path ${path.join('/')}:`, error);
        if (error.name === 'BSONError' || (error.message && error.message.includes('Argument passed in must be a string'))) {
            return NextResponse.json({ error: 'Invalid document ID format' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };

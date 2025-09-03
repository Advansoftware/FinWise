
// src/app/api/users/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAdminApp } from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function getUserId(request: NextRequest): Promise<string | null> {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        try {
            // This is for Firebase-based auth (like Google Sign-in)
            const decodedToken = await getAdminApp().auth().verifyIdToken(idToken);
            return decodedToken.uid;
        } catch (error) {
            // This could also be a custom session token, for now we assume Firebase
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
    const [action, docId] = params.path;
    const usersCollection = db.collection('users');

    try {
        if (request.method === 'POST' && action === 'signup') {
            const { email, password, displayName } = await request.json();
            if (!email || !password || !displayName) {
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
            }

            const existingUser = await usersCollection.findOne({ email });
            if (existingUser) {
                return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
            }
            
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            
            const newUser = {
                displayName,
                email,
                password: hashedPassword,
                plan: 'Básico',
                aiCredits: 0,
                createdAt: new Date().toISOString(),
            };

            const result = await usersCollection.insertOne(newUser);
            const userProfile = await usersCollection.findOne({ _id: result.insertedId });
            
            if (!userProfile) throw new Error("Could not retrieve created user");
            
            const { password: _, ...userToReturn } = userProfile;
            
            // In MongoDB, the document ID is _id. We need to map it to uid for consistency.
            (userToReturn as any).uid = userProfile._id.toHexString();
            delete (userToReturn as any)._id;

            return NextResponse.json({ user: userToReturn }, { status: 201 });
        }

        if (request.method === 'POST' && action === 'login') {
            const { email, password } = await request.json();
            if (!email || !password) {
                 return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
            }

            const user = await usersCollection.findOne({ email });
            if (!user) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            const { password: _, ...userToReturn } = user;
            (userToReturn as any).uid = user._id.toHexString();
             delete (userToReturn as any)._id;

            return NextResponse.json({ user: userToReturn });
        }

        // Default data route logic for other user-related data can be added here
        // For now, it redirects to the main data handler for collections inside a user.
         return NextResponse.json({ error: `Action '${action}' not found.` }, { status: 404 });


    } catch (error: any) {
        console.error(`API Error on path /api/users/${params.path.join('/')}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export { handler as GET, handler as POST };

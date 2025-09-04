// src/app/api/users/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAdminApp } from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';

const SALT_ROUNDS = 10;

// This function is distinct from the one in data/route, it's for user actions
async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        try {
            // For MongoDB auth, we issue a custom token. For Firebase, it's an ID token.
            // Firebase Admin SDK can verify both.
            const decodedToken = await getAdminApp().auth().verifyIdToken(idToken);
            return decodedToken.uid;
        } catch (error) {
            console.error("Error verifying ID token:", error);
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
    const [action] = params.path;
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
                plan: 'Básico' as const,
                aiCredits: 0,
                createdAt: new Date(),
            };

            const result = await usersCollection.insertOne(newUser);
            const userProfile = await usersCollection.findOne({ _id: result.insertedId });
            
            if (!userProfile) throw new Error("Could not retrieve created user");

            const customToken = await getAdminApp().auth().createCustomToken(userProfile._id.toHexString());
            
            const { password: _, ...userToReturn } = userProfile;
            userToReturn.uid = userProfile._id.toHexString(); // Add uid field for consistency
            delete (userToReturn as any)._id;

            return NextResponse.json({ user: userToReturn, token: customToken }, { status: 201 });
        }

        if (request.method === 'POST' && action === 'login') {
            const { email, password } = await request.json();
            if (!email || !password) {
                 return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
            }

            const user = await usersCollection.findOne({ email });
            if (!user || !user.password) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }
            
            const customToken = await getAdminApp().auth().createCustomToken(user._id.toHexString());

            const { password: _, ...userToReturn } = user;
            userToReturn.uid = user._id.toHexString(); // Add uid field for consistency
            delete (userToReturn as any)._id;

            return NextResponse.json({ user: userToReturn, token: customToken });
        }

        return NextResponse.json({ error: `Action '${action}' not found.` }, { status: 404 });


    } catch (error: any) {
        console.error(`API Error on path /api/users/${params.path.join('/')}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Only POST is needed for login/signup
export { handler as POST };

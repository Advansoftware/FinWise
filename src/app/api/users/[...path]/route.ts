// src/app/api/users/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAdminApp } from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';

const SALT_ROUNDS = 10;

// This function is for SOCIAL LOGINS ONLY now.
// It verifies the ID token from Google/etc. to get a trusted UID.
async function getUserIdFromToken(request: NextRequest): Promise<{uid: string, name: string | undefined, email: string | undefined} | null> {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        try {
            const decodedToken = await getAdminApp().auth().verifyIdToken(idToken);
            return {
                uid: decodedToken.uid,
                name: decodedToken.name,
                email: decodedToken.email,
            };
        } catch (error) {
            console.error("Error verifying social ID token:", error);
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

            const { password: _, ...userToReturn } = userProfile as any;
            userToReturn.uid = userProfile._id.toHexString(); 
            delete userToReturn._id;

            // Configurar dados padrão para o novo usuário (categorias, configurações, etc.)
            try {
                const { setupDefaultUserData } = await import('@/services/default-setup-service');
                await setupDefaultUserData(userToReturn.uid);
                console.log(`✅ Dados padrão configurados para novo usuário ${userToReturn.uid}`);
            } catch (setupError) {
                console.error('Erro ao configurar dados padrão na API:', setupError);
                // Não falha o cadastro se houver erro na configuração padrão
            }

            // No token is returned, session is managed client-side
            return NextResponse.json({ user: userToReturn }, { status: 201 });
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
            
            const { password: _, ...userToReturn } = user as any;
            userToReturn.uid = user._id.toHexString();
            delete userToReturn._id;

            return NextResponse.json({ user: userToReturn });
        }

        if (request.method === 'POST' && action === 'social-login') {
            const socialUser = await getUserIdFromToken(request);
            if (!socialUser) {
                 return NextResponse.json({ error: 'Invalid social token' }, { status: 401 });
            }

            // Find user by their main email.
            let user = await usersCollection.findOne({ email: socialUser.email });

            if (!user) {
                // If user doesn't exist, create a new one.
                const newUser = {
                    _id: new ObjectId(socialUser.uid), // Use the Firebase UID as the MongoDB ID
                    displayName: socialUser.name || 'New User',
                    email: socialUser.email,
                    // No password for social logins
                    plan: 'Básico' as const,
                    aiCredits: 0,
                    createdAt: new Date(),
                };
                await usersCollection.insertOne(newUser);
                user = newUser;

                // Configurar dados padrão para o novo usuário social (categorias, configurações, etc.)
                try {
                    const { setupDefaultUserData } = await import('@/services/default-setup-service');
                    await setupDefaultUserData(socialUser.uid);
                    console.log(`✅ Dados padrão configurados para novo usuário social ${socialUser.uid}`);
                } catch (setupError) {
                    console.error('Erro ao configurar dados padrão para usuário social:', setupError);
                    // Não falha o cadastro se houver erro na configuração padrão
                }
            }

            const { password, ...userToReturn } = user as any;
            userToReturn.uid = user._id.toHexString();
            delete userToReturn._id;
            
            return NextResponse.json({ user: userToReturn });
        }

        return NextResponse.json({ error: `Action '${action}' not found.` }, { status: 404 });


    } catch (error: any) {
        console.error(`API Error on path /api/users/${params.path.join('/')}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Only POST is needed for login/signup
export { handler as POST };

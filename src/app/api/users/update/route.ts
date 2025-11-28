// src/app/api/users/update/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {auth} from '@/lib/auth';
import {MongoClient, ObjectId} from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required');
}

const client = new MongoClient(process.env.MONGODB_URI);

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { userId, updates } = await request.json();

    // Verificar se está atualizando seu próprio perfil
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'gastometria');
    const usersCollection = db.collection('users');

    // Atualizar apenas campos permitidos
    const allowedUpdates = ['displayName', 'email'];
    const filteredUpdates: any = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo válido para atualizar' },
        { status: 400 }
      );
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: filteredUpdates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

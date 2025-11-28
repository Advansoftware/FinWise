// src/app/api/users/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { MongoClient, ObjectId, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required');
}

// Opções de conexão para MongoDB Atlas
const uri = process.env.MONGODB_URI;
const isAtlas = uri.includes('mongodb.net') || uri.includes('mongodb+srv');
const mongoOptions: MongoClientOptions = isAtlas ? {
  tls: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
} : {};

const client = new MongoClient(uri, mongoOptions);

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

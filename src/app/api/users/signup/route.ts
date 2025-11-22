// src/app/api/users/signup/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {MongoClient, ObjectId} from 'mongodb';
import bcrypt from 'bcryptjs';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required');
}

const client = new MongoClient(process.env.MONGODB_URI);

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'gastometria');
    const usersCollection = db.collection('users');

    // Verificar se usuário já existe
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 400 }
      );
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário
    const newUser = {
      email,
      passwordHash,
      displayName: name,
      plan: 'Básico',
      aiCredits: 10, // Créditos gratuitos para novos usuários
      createdAt: new Date().toISOString(),
    };

    const result = await usersCollection.insertOne(newUser);
    const userId = result.insertedId.toString();

    // Configurar dados padrão para o novo usuário
    try {
      const { setupDefaultUserData } = await import('@/services/default-setup-service');
      await setupDefaultUserData(userId);
    } catch (setupError) {
      console.error('Erro ao configurar dados padrão:', setupError);
      // Não falha o cadastro se houver erro na configuração padrão
    }

    return NextResponse.json({
      success: true,
      userId,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}

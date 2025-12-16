// src/app/api/users/cpf/route.ts
// API para gerenciar CPF criptografado do usuário

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { encrypt, decrypt, maskCPF, isValidCPF } from '@/lib/encryption';
import { ObjectId } from 'mongodb';

/**
 * Helper para criar query flexível de busca de usuário
 * Suporta busca por _id (ObjectId), email, ou uid
 */
function buildUserQuery(userId: string) {
  // Se parece com ObjectId, buscar por _id
  if (ObjectId.isValid(userId) && userId.length === 24) {
    return { _id: new ObjectId(userId) };
  }
  // Se parece com email
  if (userId.includes('@')) {
    return { email: userId };
  }
  // Tentar buscar por uid ou _id como string
  return { $or: [{ uid: userId }, { _id: new ObjectId(userId) }] };
}

/**
 * GET /api/users/cpf
 * Verificar se o usuário tem CPF cadastrado
 * Use ?decrypt=true para obter o CPF descriptografado (apenas para uso interno)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const shouldDecrypt = searchParams.get('decrypt') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const user = await db.collection('users').findOne(
      buildUserQuery(userId),
      { projection: { cpfEncrypted: 1 } }
    );

    if (!user || !user.cpfEncrypted) {
      return NextResponse.json({
        hasCpf: false,
        maskedCpf: null,
        cpf: null,
      });
    }

    // Descriptografar
    const cpf = decrypt(user.cpfEncrypted);

    // Retornar CPF completo apenas se solicitado (para uso interno como Smart Transfers)
    if (shouldDecrypt) {
      return NextResponse.json({
        hasCpf: true,
        cpf,
        maskedCpf: maskCPF(cpf),
      });
    }

    return NextResponse.json({
      hasCpf: true,
      maskedCpf: maskCPF(cpf),
    });
  } catch (error: any) {
    console.error('Error checking CPF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check CPF' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/cpf
 * Salvar CPF criptografado
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, cpf } = body;

    if (!userId || !cpf) {
      return NextResponse.json(
        { error: 'userId and cpf are required' },
        { status: 400 }
      );
    }

    // Limpar e validar CPF
    const cleanCpf = cpf.replace(/\D/g, '');

    if (!isValidCPF(cleanCpf)) {
      return NextResponse.json(
        { error: 'CPF inválido' },
        { status: 400 }
      );
    }

    // Criptografar
    const cpfEncrypted = encrypt(cleanCpf);

    const { db } = await connectToDatabase();

    const result = await db.collection('users').updateOne(
      buildUserQuery(userId),
      {
        $set: {
          cpfEncrypted,
          updatedAt: new Date().toISOString(),
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      maskedCpf: maskCPF(cleanCpf),
    });
  } catch (error: any) {
    console.error('Error saving CPF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save CPF' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/cpf
 * Remover CPF do usuário
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    await db.collection('users').updateOne(
      buildUserQuery(userId),
      {
        $unset: { cpfEncrypted: '' },
        $set: { updatedAt: new Date().toISOString() },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting CPF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete CPF' },
      { status: 500 }
    );
  }
}

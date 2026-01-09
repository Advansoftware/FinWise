// src/app/api/family/invites/token/[token]/route.ts

/**
 * API para buscar convite por token
 * Usado na página de aceitar convite via link de email
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { createFamilyService } from '@/core/adapters/mongodb/mongodb-family.adapter';
import { FamilyError } from '@/core/ports/family.port';

async function getFamilyService() {
  const { db } = await connectToDatabase();
  return createFamilyService(db);
}

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET - Buscar convite por token
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 });
    }

    const familyService = await getFamilyService();
    const invite = await familyService.getInviteByToken(token);

    if (!invite) {
      return NextResponse.json(
        { error: 'Convite não encontrado ou expirado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ invite });
  } catch (error) {
    console.error('Erro ao buscar convite:', error);
    if (error instanceof FamilyError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

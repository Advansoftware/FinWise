// src/app/api/family/route.ts

/**
 * API Family - Rotas principais para gerenciamento de família
 * 
 * GET    - Obtém a família do usuário
 * POST   - Cria uma nova família (apenas Infinity)
 * PATCH  - Atualiza informações da família
 * DELETE - Remove a família
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { createFamilyService } from '@/core/adapters/mongodb/mongodb-family.adapter';
import { CreateFamilyInput } from '@/lib/family-types';
import { FamilyError } from '@/core/ports/family.port';

async function getFamilyService() {
  const { db } = await connectToDatabase();
  return createFamilyService(db);
}

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (userId && ObjectId.isValid(userId)) {
    return userId;
  }
  return null;
}

// GET - Obtém a família do usuário
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const familyService = await getFamilyService();
    const family = await familyService.getUserFamily(userId);

    if (!family) {
      return NextResponse.json({ family: null }, { status: 200 });
    }

    return NextResponse.json({ family });
  } catch (error) {
    console.error('Erro ao buscar família:', error);
    if (error instanceof FamilyError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Cria uma nova família
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar plano Infinity é feito no serviço
    const body: CreateFamilyInput = await request.json();

    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome da família é obrigatório (mínimo 2 caracteres)' },
        { status: 400 }
      );
    }

    const familyService = await getFamilyService();
    const family = await familyService.createFamily(userId, body);

    return NextResponse.json({ family }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar família:', error);
    if (error instanceof FamilyError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PATCH - Atualiza a família
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { familyId, ...updateData } = body;

    if (!familyId) {
      return NextResponse.json({ error: 'familyId é obrigatório' }, { status: 400 });
    }

    const familyService = await getFamilyService();
    const family = await familyService.updateFamily(familyId, userId, updateData);

    return NextResponse.json({ family });
  } catch (error) {
    console.error('Erro ao atualizar família:', error);
    if (error instanceof FamilyError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Remove a família
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');

    if (!familyId) {
      return NextResponse.json({ error: 'familyId é obrigatório' }, { status: 400 });
    }

    const familyService = await getFamilyService();
    await familyService.deleteFamily(familyId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar família:', error);
    if (error instanceof FamilyError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

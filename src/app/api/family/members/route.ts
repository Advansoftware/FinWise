// src/app/api/family/members/route.ts

/**
 * API Family Members - Gerenciamento de membros
 * 
 * PATCH  - Atualizar membro (role, configurações)
 * DELETE - Remover membro ou sair da família
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { createFamilyService } from '@/core/adapters/mongodb/mongodb-family.adapter';
import { UpdateSharingInput, FamilyMemberRole } from '@/lib/family-types';
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

// PATCH - Atualizar membro
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { familyId, memberId, action, ...data } = body;

    if (!familyId || !memberId) {
      return NextResponse.json(
        { error: 'familyId e memberId são obrigatórios' },
        { status: 400 }
      );
    }

    const familyService = await getFamilyService();

    if (action === 'updateRole') {
      if (!data.role) {
        return NextResponse.json({ error: 'role é obrigatório' }, { status: 400 });
      }
      const member = await familyService.updateMemberRole(
        familyId,
        userId,
        memberId,
        data.role as FamilyMemberRole
      );
      return NextResponse.json({ member });
    }

    if (action === 'updateSharing') {
      if (!data.sharing) {
        return NextResponse.json({ error: 'sharing é obrigatório' }, { status: 400 });
      }
      const updateData: UpdateSharingInput = {
        familyId,
        memberId,
        sharing: data.sharing,
      };
      const member = await familyService.updateSharing(userId, updateData);
      return NextResponse.json({ member });
    }

    return NextResponse.json(
      { error: 'action deve ser "updateRole" ou "updateSharing"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao atualizar membro:', error);
    if (error instanceof FamilyError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Remover membro ou sair da família
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    const memberId = searchParams.get('memberId');
    const action = searchParams.get('action'); // 'remove' ou 'leave'

    if (!familyId) {
      return NextResponse.json({ error: 'familyId é obrigatório' }, { status: 400 });
    }

    const familyService = await getFamilyService();

    if (action === 'leave') {
      // Usuário quer sair da família
      await familyService.leaveFamily(familyId, userId);
      return NextResponse.json({ success: true, message: 'Você saiu da família' });
    }

    if (action === 'remove' && memberId) {
      // Admin/owner removendo membro
      await familyService.removeMember(familyId, userId, memberId);
      return NextResponse.json({ success: true, message: 'Membro removido' });
    }

    return NextResponse.json(
      { error: 'action deve ser "leave" ou "remove" (com memberId)' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    if (error instanceof FamilyError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

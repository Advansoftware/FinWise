// src/app/api/family/invites/[id]/route.ts

/**
 * API Family Invite Actions - Ações em convites específicos
 * 
 * POST   - Aceitar ou recusar convite
 * DELETE - Cancelar convite (admin/owner)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { createFamilyService } from '@/core/adapters/mongodb/mongodb-family.adapter';
import { AcceptInviteInput } from '@/lib/family-types';
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

// POST - Aceitar ou recusar convite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: inviteId } = await params;
    const body = await request.json();
    const action = body.action as 'accept' | 'decline';

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'action deve ser "accept" ou "decline"' },
        { status: 400 }
      );
    }

    const familyService = await getFamilyService();

    if (action === 'accept') {
      const acceptData: AcceptInviteInput = {
        inviteId,
        privacySettings: body.privacySettings,
      };
      const family = await familyService.acceptInvite(userId, acceptData);
      return NextResponse.json({ family, message: 'Convite aceito com sucesso!' });
    } else {
      await familyService.declineInvite(userId, inviteId);
      return NextResponse.json({ message: 'Convite recusado' });
    }
  } catch (error) {
    console.error('Erro ao processar convite:', error);
    if (error instanceof FamilyError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Cancelar convite
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: inviteId } = await params;
    const familyService = await getFamilyService();

    await familyService.cancelInvite(userId, inviteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao cancelar convite:', error);
    if (error instanceof FamilyError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

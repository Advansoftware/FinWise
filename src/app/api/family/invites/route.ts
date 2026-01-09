// src/app/api/family/invites/route.ts

/**
 * API Family Invites - Gerenciamento de convites
 * 
 * GET  - Lista convites pendentes (para família ou usuário)
 * POST - Cria novo convite
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { createFamilyService } from '@/core/adapters/mongodb/mongodb-family.adapter';
import { InviteMemberInput } from '@/lib/family-types';
import { FamilyError } from '@/core/ports/family.port';
import { sendFamilyInviteEmail } from '@/lib/email';

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

// GET - Lista convites
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    const forUser = searchParams.get('forUser') === 'true';
    const email = searchParams.get('email');

    const familyService = await getFamilyService();

    if (forUser && email) {
      // Listar convites pendentes para o usuário atual
      const invites = await familyService.getUserPendingInvites(email);
      return NextResponse.json({ invites });
    }

    if (familyId) {
      // Listar convites pendentes da família
      const invites = await familyService.getPendingInvites(familyId);
      return NextResponse.json({ invites });
    }

    return NextResponse.json({ error: 'familyId ou forUser=true é obrigatório' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao listar convites:', error);
    if (error instanceof FamilyError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar convite
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body: InviteMemberInput = await request.json();

    if (!body.familyId) {
      return NextResponse.json({ error: 'familyId é obrigatório' }, { status: 400 });
    }

    if (!body.email || !body.email.includes('@')) {
      return NextResponse.json({ error: 'Email válido é obrigatório' }, { status: 400 });
    }

    const familyService = await getFamilyService();
    const invite = await familyService.inviteMember(userId, body);

    // Enviar email de convite
    try {
      await sendFamilyInviteEmail({
        inviteeEmail: invite.email,
        inviterName: invite.invitedByName,
        familyName: invite.familyName || 'Família',
        inviteToken: invite.token,
        role: invite.role,
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de convite:', emailError);
      // Não falha a criação do convite se o email falhar
    }

    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar convite:', error);
    if (error instanceof FamilyError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// src/app/api/v1/merchant-rules/[id]/route.ts
// API para gerenciar regra individual

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedMobileUser } from '@/lib/api-auth';
import { SmartTransactionsService } from '@/services/smart-transactions-service';

// PUT /api/v1/merchant-rules/[id] - Atualizar regra
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await SmartTransactionsService.updateMerchantRule(
      authResult.user.id,
      id,
      body
    );

    if (!updated) {
      return NextResponse.json({ error: 'Regra não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating merchant rule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/v1/merchant-rules/[id] - Deletar regra
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const { id } = await params;

    const deleted = await SmartTransactionsService.deleteMerchantRule(
      authResult.user.id,
      id
    );

    if (!deleted) {
      return NextResponse.json({ error: 'Regra não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting merchant rule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

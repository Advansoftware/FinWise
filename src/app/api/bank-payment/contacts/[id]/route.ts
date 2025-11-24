// src/app/api/bank-payment/contacts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MongoBankPaymentRepository } from '@/core/adapters/mongodb/mongodb-bank-payment.adapter';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const repository = new MongoBankPaymentRepository(db);

    const contact = await repository.findContactById(params.id);

    if (!contact) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
    }

    // Verificar se pertence ao usuário
    if (contact.userId !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    return NextResponse.json({ contact });
  } catch (error: any) {
    console.error('Erro ao buscar contato:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar contato', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const repository = new MongoBankPaymentRepository(db);

    // Verificar se contato existe e pertence ao usuário
    const existing = await repository.findContactById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const contact = await repository.updateContact(params.id, body);

    return NextResponse.json({ contact });
  } catch (error: any) {
    console.error('Erro ao atualizar contato:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar contato', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const repository = new MongoBankPaymentRepository(db);

    // Verificar se contato existe e pertence ao usuário
    const existing = await repository.findContactById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    await repository.deleteContact(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao remover contato:', error);
    return NextResponse.json(
      { error: 'Erro ao remover contato', message: error.message },
      { status: 500 }
    );
  }
}

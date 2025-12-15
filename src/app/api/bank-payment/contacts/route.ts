// src/app/api/bank-payment/contacts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MongoBankPaymentRepository } from '@/core/adapters/mongodb/mongodb-bank-payment.adapter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const repository = new MongoBankPaymentRepository(db);

    const contacts = await repository.findContactsByUserId(userId);

    return NextResponse.json({ contacts });
  } catch (error: any) {
    console.error('Erro ao buscar contatos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar contatos', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const body = await request.json();

    // Validação básica - suporta tanto formato novo (pixKeys) quanto legado (pixKey/pixKeyType)
    const hasNewFormat = body.pixKeys && Array.isArray(body.pixKeys) && body.pixKeys.length > 0;
    const hasLegacyFormat = body.pixKey && body.pixKeyType;
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!hasNewFormat && !hasLegacyFormat) {
      return NextResponse.json(
        { error: 'Pelo menos uma chave PIX é obrigatória' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const repository = new MongoBankPaymentRepository(db);

    const contact = await repository.createContact(userId, body);

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar contato:', error);
    return NextResponse.json(
      { error: 'Erro ao criar contato', message: error.message },
      { status: 500 }
    );
  }
}

// src/app/api/bank-payment/requests/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MongoBankPaymentRepository } from '@/core/adapters/mongodb/mongodb-bank-payment.adapter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { db } = await connectToDatabase();
    const repository = new MongoBankPaymentRepository(db);

    const paymentRequest = await repository.findPaymentRequestById(id);

    if (!paymentRequest) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ request: paymentRequest });
  } catch (error: any) {
    console.error('Erro ao buscar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar solicitação', message: error.message },
      { status: 500 }
    );
  }
}

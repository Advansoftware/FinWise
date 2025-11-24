// src/app/api/bank-payment/requests/[id]/complete/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MongoBankPaymentRepository } from '@/core/adapters/mongodb/mongodb-bank-payment.adapter';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const repository = new MongoBankPaymentRepository(db);

    const paymentRequest = await repository.findPaymentRequestById(params.id);

    if (!paymentRequest) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }

    // Atualizar status
    await repository.updatePaymentRequestStatus(params.id, 'completed');

    // Adicionar evento
    await repository.addPaymentEvent(params.id, {
      type: 'completed',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao completar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao completar solicitação', message: error.message },
      { status: 500 }
    );
  }
}

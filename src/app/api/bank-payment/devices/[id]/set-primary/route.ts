// src/app/api/bank-payment/devices/[id]/set-primary/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MongoBankPaymentRepository } from '@/core/adapters/mongodb/mongodb-bank-payment.adapter';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const repository = new MongoBankPaymentRepository(db);

    // Verificar se dispositivo existe e pertence ao usuário
    const existing = await repository.findDeviceById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Dispositivo não encontrado' }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const success = await repository.setPrimaryDevice(userId, existing.deviceId);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Falha ao definir dispositivo primário' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erro ao definir dispositivo primário:', error);
    return NextResponse.json(
      { error: 'Erro ao definir dispositivo primário', message: error.message },
      { status: 500 }
    );
  }
}

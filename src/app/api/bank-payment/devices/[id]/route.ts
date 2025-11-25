// src/app/api/bank-payment/devices/[id]/route.ts

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

    const device = await repository.findDeviceById(params.id);

    if (!device) {
      return NextResponse.json({ error: 'Dispositivo não encontrado' }, { status: 404 });
    }

    if (device.userId !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    return NextResponse.json({ device });
  } catch (error: any) {
    console.error('Erro ao buscar dispositivo:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dispositivo', message: error.message },
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

    const existing = await repository.findDeviceById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Dispositivo não encontrado' }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const device = await repository.updateDevice(params.id, body);

    return NextResponse.json({ device });
  } catch (error: any) {
    console.error('Erro ao atualizar dispositivo:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar dispositivo', message: error.message },
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

    // Verificar se dispositivo existe e pertence ao usuário
    const existing = await repository.findDeviceById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Dispositivo não encontrado' }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    await repository.removeDevice(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao remover dispositivo:', error);
    return NextResponse.json(
      { error: 'Erro ao remover dispositivo', message: error.message },
      { status: 500 }
    );
  }
}

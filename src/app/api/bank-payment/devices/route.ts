// src/app/api/bank-payment/devices/route.ts

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

    const devices = await repository.findDevicesByUserId(userId);

    return NextResponse.json({ devices });
  } catch (error: any) {
    console.error('Erro ao buscar dispositivos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dispositivos', message: error.message },
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

    // Validação básica
    if (!body.deviceId || !body.name || !body.type || !body.platform) {
      return NextResponse.json(
        { error: 'deviceId, name, type e platform são obrigatórios' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const repository = new MongoBankPaymentRepository(db);

    const device = await repository.registerDevice(userId, body);

    return NextResponse.json({ device }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao registrar dispositivo:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar dispositivo', message: error.message },
      { status: 500 }
    );
  }
}

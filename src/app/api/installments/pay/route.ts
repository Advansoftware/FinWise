// src/app/api/installments/pay/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/core/services/service-factory';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { installmentId, installmentNumber, paidAmount, paidDate, transactionId } = body;

    // Validar campos obrigatórios
    if (!installmentId || !installmentNumber || !paidAmount || !paidDate) {
      return NextResponse.json({
        error: 'installmentId, installmentNumber, paidAmount, and paidDate are required'
      }, { status: 400 });
    }

    const db = await getDatabaseAdapter();

    const payment = await db.installments.payInstallment({
      installmentId,
      installmentNumber,
      paidAmount,
      paidDate,
      transactionId
    });

    if (!payment) {
      return NextResponse.json({
        error: 'Failed to record payment or installment not found'
      }, { status: 404 });
    }

    return NextResponse.json(payment, { status: 201 });

  } catch (error) {
    console.error('POST /api/installments/pay error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}

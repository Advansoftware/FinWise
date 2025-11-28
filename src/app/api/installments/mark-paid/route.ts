// src/app/api/installments/mark-paid/route.ts

import {NextRequest, NextResponse} from 'next/server';
import {getDatabaseAdapter} from '@/core/services/service-factory';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { installmentId, installmentNumber, paidAmount, paidDate, markOnly } = body;

    if (!installmentId || !installmentNumber || !paidAmount || !paidDate) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    const db = await getDatabaseAdapter();

    // Buscar o parcelamento
    const installment = await db.installments.findById(installmentId);
    if (!installment) {
      return NextResponse.json(
        { error: 'Parcelamento não encontrado' },
        { status: 404 }
      );
    }

    // Encontrar o pagamento específico
    const paymentIndex = installment.payments.findIndex(
      p => p.installmentNumber === installmentNumber && p.status !== 'paid'
    );

    if (paymentIndex === -1) {
      return NextResponse.json(
        { error: 'Parcela não encontrada ou já paga' },
        { status: 404 }
      );
    }

    // Atualizar o pagamento
    installment.payments[paymentIndex] = {
      ...installment.payments[paymentIndex],
      status: 'paid',
      paidAmount: paidAmount,
      paidDate: paidDate,
    };

    // Recalcular valores do parcelamento
    const paidPayments = installment.payments.filter(p => p.status === 'paid');
    installment.paidInstallments = paidPayments.length;
    installment.totalPaid = paidPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    installment.remainingAmount = installment.totalAmount - installment.totalPaid;
    installment.isCompleted = installment.paidInstallments >= installment.totalInstallments;
    installment.updatedAt = new Date().toISOString();

    // Salvar no banco
    await db.installments.update(installmentId, installment);

    return NextResponse.json(
      { message: 'Parcela marcada como paga com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao marcar parcela como paga:', error);

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

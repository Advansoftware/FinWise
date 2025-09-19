// src/app/api/installments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/core/services/service-factory';

async function getMonthlyInstallmentDetails(userId: string, month: string, db: any, type?: string) {
  const [year, monthNumber] = month.split('-');
  const startDate = new Date(parseInt(year), parseInt(monthNumber) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(monthNumber), 0, 23, 59, 59, 999);

  const allInstallments = await db.installments.findByUserId(userId);
  const monthlyDetails: any[] = [];

  for (const installment of allInstallments) {
    // Filtrar por tipo se especificado
    if (type) {
      const isRecurring = installment.isRecurring === true;
      if (type === 'fixed' && !isRecurring) continue;
      if (type === 'variable' && isRecurring) continue;
    }

    // Calcular as parcelas do mês específico
    const startInstallmentDate = new Date(installment.startDate);

    for (let i = 0; i < installment.totalInstallments; i++) {
      const dueDate = new Date(startInstallmentDate);
      dueDate.setMonth(startInstallmentDate.getMonth() + i);

      // Verificar se a parcela vence no mês solicitado
      if (dueDate >= startDate && dueDate <= endDate) {
        const installmentNumber = i + 1;

        // Encontrar o pagamento correspondente se existir
        const payment = installment.payments?.find((p: any) =>
          p.installmentNumber === installmentNumber
        );

        const status = payment?.status || (dueDate < new Date() ? 'overdue' : 'pending');

        monthlyDetails.push({
          id: installment.id,
          name: installment.name,
          description: installment.description,
          category: installment.category,
          subcategory: installment.subcategory,
          establishment: installment.establishment,
          amount: installment.installmentAmount,
          installmentNumber,
          totalInstallments: installment.totalInstallments,
          dueDate: dueDate.toISOString(),
          status,
          paidDate: payment?.paidDate,
          paidAmount: payment?.paidAmount,
          isRecurring: installment.isRecurring || false
        });
      }
    }
  }

  return monthlyDetails.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = await getDatabaseAdapter();

    switch (action) {
      case 'summary':
        const summary = await db.installments.getInstallmentSummary(userId);
        return NextResponse.json(summary);

      case 'upcoming':
        const days = parseInt(searchParams.get('days') || '30');
        const upcoming = await db.installments.findUpcomingPayments(userId, days);
        return NextResponse.json(upcoming);

      case 'overdue':
        const overdue = await db.installments.findOverduePayments(userId);
        return NextResponse.json(overdue);

      case 'projections':
        const months = parseInt(searchParams.get('months') || '12');
        const projections = await db.installments.projectMonthlyCommitments(userId, months);
        return NextResponse.json(projections);

      case 'monthly-details':
        const month = searchParams.get('month');
        const type = searchParams.get('type'); // 'fixed' ou 'variable'
        if (!month) {
          return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 });
        }
        const monthlyDetails = await getMonthlyInstallmentDetails(userId, month, db, type || undefined);
        return NextResponse.json(monthlyDetails);

      case 'active':
        const activeInstallments = await db.installments.findActiveInstallments(userId);
        return NextResponse.json(activeInstallments);

      default:
        const allInstallments = await db.installments.findByUserId(userId);
        return NextResponse.json(allInstallments);
    }

  } catch (error) {
    console.error('GET /api/installments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch installments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...installmentData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validar campos obrigatórios
    const requiredFields = ['name', 'totalAmount', 'totalInstallments', 'category', 'startDate', 'sourceWalletId'];
    for (const field of requiredFields) {
      if (!installmentData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    const db = await getDatabaseAdapter();

    // Validar se a carteira existe e pertence ao usuário
    try {
      const wallet = await db.wallets.findById(installmentData.sourceWalletId);
      if (!wallet || wallet.userId !== userId) {
        return NextResponse.json({
          error: 'Carteira não encontrada ou não pertence ao usuário'
        }, { status: 400 });
      }
    } catch (walletError) {
      console.error('Error validating wallet:', walletError);
      return NextResponse.json({
        error: 'Erro ao validar carteira'
      }, { status: 400 });
    }

    const installment = await db.installments.create(userId, installmentData);

    return NextResponse.json(installment, { status: 201 });

  } catch (error) {
    console.error('POST /api/installments error:', error);
    return NextResponse.json(
      { error: 'Failed to create installment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Installment ID is required' }, { status: 400 });
    }

    const db = await getDatabaseAdapter();

    // Se estamos atualizando sourceWalletId, validar se a carteira existe
    if (updateData.sourceWalletId && userId) {
      try {
        const wallet = await db.wallets.findById(updateData.sourceWalletId);
        if (!wallet || wallet.userId !== userId) {
          return NextResponse.json({
            error: 'Carteira não encontrada ou não pertence ao usuário'
          }, { status: 400 });
        }
      } catch (walletError) {
        console.error('Error validating wallet during update:', walletError);
        return NextResponse.json({
          error: 'Erro ao validar carteira'
        }, { status: 400 });
      }
    }

    const installment = await db.installments.update(id, updateData);

    if (!installment) {
      return NextResponse.json({ error: 'Installment not found' }, { status: 404 });
    }

    return NextResponse.json(installment);

  } catch (error) {
    console.error('PUT /api/installments error:', error);
    return NextResponse.json(
      { error: 'Failed to update installment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Installment ID is required' }, { status: 400 });
    }

    const db = await getDatabaseAdapter();
    const success = await db.installments.delete(id);

    if (!success) {
      return NextResponse.json({ error: 'Installment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('DELETE /api/installments error:', error);
    return NextResponse.json(
      { error: 'Failed to delete installment' },
      { status: 500 }
    );
  }
}

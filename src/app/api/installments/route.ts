// src/app/api/installments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/core/services/service-factory';

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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Installment ID is required' }, { status: 400 });
    }

    const db = await getDatabaseAdapter();
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

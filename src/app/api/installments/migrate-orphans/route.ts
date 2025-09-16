// src/app/api/installments/migrate-orphans/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/core/services/service-factory';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = await getDatabaseAdapter();

    // Executar migração
    const result = await db.installments.migrateOrphanedWalletReferences(userId);

    return NextResponse.json({
      success: true,
      message: `Migração concluída: ${result.installmentsMigrated} parcelamentos e ${result.transactionsMigrated} transações migradas`,
      ...result
    });

  } catch (error) {
    console.error('POST /api/installments/migrate-orphans error:', error);
    return NextResponse.json(
      { error: 'Failed to migrate orphaned references' },
      { status: 500 }
    );
  }
}
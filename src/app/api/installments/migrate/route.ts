// src/app/api/installments/migrate/route.ts

import {NextRequest, NextResponse} from 'next/server';
import {getDatabaseAdapter} from '@/core/services/service-factory';
import {ObjectId} from 'mongodb';

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (userId && ObjectId.isValid(userId)) {
    return userId;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authenticatedUserId = await getUserIdFromRequest(request);
    if (!authenticatedUserId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing user identifier.' }, { status: 401 });
    }

    const db = await getDatabaseAdapter();

    // Executar migração
    const result = await db.installments.migrateOrphanedWalletReferences(authenticatedUserId);

    return NextResponse.json({
      success: true,
      message: `Migração concluída: ${result.installmentsMigrated} parcelamentos e ${result.transactionsMigrated} transações corrigidas`,
      ...result
    });

  } catch (error) {
    console.error('POST /api/installments/migrate error:', error);
    return NextResponse.json(
      { error: 'Failed to migrate orphaned data' },
      { status: 500 }
    );
  }
}
// src/app/api/v1/recurrences/route.ts
// API para detecção de transações recorrentes

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedMobileUser } from '@/lib/api-auth';
import { SmartTransactionsService } from '@/services/smart-transactions-service';

// GET /api/v1/recurrences - Detectar recorrências
export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const recurrences = await SmartTransactionsService.detectRecurrences(authResult.user.id);
    return NextResponse.json(recurrences);
  } catch (error) {
    console.error('Error detecting recurrences:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// src/app/api/v1/anomalies/route.ts
// API para detecção de anomalias em transações

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedMobileUser } from '@/lib/api-auth';
import { SmartTransactionsService } from '@/services/smart-transactions-service';

// GET /api/v1/anomalies - Detectar anomalias
export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const anomalies = await SmartTransactionsService.detectAnomalies(authResult.user.id);
    return NextResponse.json(anomalies);
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

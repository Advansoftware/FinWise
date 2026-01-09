// src/app/api/v1/merchant-rules/route.ts
// API para gerenciar regras de estabelecimentos

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedMobileUser } from '@/lib/api-auth';
import { SmartTransactionsService } from '@/services/smart-transactions-service';

// GET /api/v1/merchant-rules - Listar regras
export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const rules = await SmartTransactionsService.getMerchantRules(authResult.user.id);
    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching merchant rules:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/v1/merchant-rules - Criar nova regra
export async function POST(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { merchantName, defaultCategory, defaultSubcategory, defaultWalletId, defaultType, merchantPatterns } = body;

    if (!merchantName || !defaultCategory) {
      return NextResponse.json({
        error: 'merchantName e defaultCategory são obrigatórios'
      }, { status: 400 });
    }

    const rule = await SmartTransactionsService.createMerchantRule(authResult.user.id, {
      merchantName,
      merchantPatterns,
      defaultCategory,
      defaultSubcategory,
      defaultWalletId,
      defaultType,
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating merchant rule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

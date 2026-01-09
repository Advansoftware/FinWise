// src/app/api/v1/smart-transactions/route.ts
// API para Transações Inteligentes

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedMobileUser } from '@/lib/api-auth';
import { SmartTransactionsService } from '@/services/smart-transactions-service';

// GET /api/v1/smart-transactions - Obter sugestões inteligentes
export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const { searchParams } = new URL(request.url);
    const item = searchParams.get('item') || '';
    const establishment = searchParams.get('establishment') || undefined;
    const amount = searchParams.get('amount') ? parseFloat(searchParams.get('amount')!) : undefined;

    if (!item && !establishment) {
      return NextResponse.json({
        error: 'Pelo menos "item" ou "establishment" é obrigatório'
      }, { status: 400 });
    }

    const suggestions = await SmartTransactionsService.getSuggestions(
      user.id,
      item,
      establishment,
      amount
    );

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error getting smart suggestions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/v1/smart-transactions - Criar regra a partir de transação
export async function POST(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create-rule': {
        const { merchantName, defaultCategory, defaultSubcategory, defaultWalletId, defaultType } = body;

        if (!merchantName || !defaultCategory) {
          return NextResponse.json({
            error: 'merchantName e defaultCategory são obrigatórios'
          }, { status: 400 });
        }

        const rule = await SmartTransactionsService.createMerchantRule(user.id, {
          merchantName,
          defaultCategory,
          defaultSubcategory,
          defaultWalletId,
          defaultType,
        });

        return NextResponse.json({ success: true, rule }, { status: 201 });
      }

      case 'create-rule-from-transaction': {
        const { transaction, applyToExisting } = body;

        if (!transaction) {
          return NextResponse.json({ error: 'transaction é obrigatório' }, { status: 400 });
        }

        const result = await SmartTransactionsService.createRuleAndApplyToSimilar(
          user.id,
          transaction,
          applyToExisting !== false
        );

        return NextResponse.json({
          success: true,
          rule: result.rule,
          appliedCount: result.appliedCount,
        }, { status: 201 });
      }

      case 'apply-rule': {
        const { ruleId, transactionIds, updateCategory, updateWallet } = body;

        if (!ruleId || !transactionIds || !Array.isArray(transactionIds)) {
          return NextResponse.json({
            error: 'ruleId e transactionIds são obrigatórios'
          }, { status: 400 });
        }

        const result = await SmartTransactionsService.applyRuleToTransactions(
          user.id,
          ruleId,
          transactionIds,
          updateCategory !== false,
          updateWallet === true
        );

        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({
          error: 'Ação inválida. Use: create-rule, create-rule-from-transaction, apply-rule'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in smart transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

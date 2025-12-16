// src/app/api/pluggy/transactions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getPluggyService, PluggyTransaction } from '@/services/pluggy';
import { connectToDatabase } from '@/lib/mongodb';
import { Transaction, TransactionCategory } from '@/lib/types';

/**
 * Map Pluggy category to app category (Portuguese)
 */
function mapCategory(pluggyCategory?: string): TransactionCategory {
  if (!pluggyCategory) return 'Outros';

  const categoryMap: Record<string, TransactionCategory> = {
    'Food & Groceries': 'Supermercado',
    'Restaurants': 'Restaurante',
    'Supermarkets': 'Supermercado',
    'Transportation': 'Transporte',
    'Uber / Taxi': 'Transporte',
    'Gas Stations': 'Transporte',
    'Entertainment': 'Entretenimento',
    'Shopping': 'Vestuário',
    'Health': 'Saúde',
    'Education': 'Educação',
    'Housing': 'Contas',
    'Bills & Utilities': 'Contas',
    'Transfers': 'Transferência',
    'Income': 'Salário',
    'Salary': 'Salário',
  };

  for (const [key, value] of Object.entries(categoryMap)) {
    if (pluggyCategory.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  return 'Outros';
}

/**
 * Map Pluggy transaction to app transaction format
 */
function mapTransaction(
  pluggyTx: PluggyTransaction,
  userId: string,
  walletId: string
): Omit<Transaction, 'id'> & { metadata: ImportedTransactionMetadata } {
  const type: 'income' | 'expense' | 'transfer' = pluggyTx.type === 'CREDIT' ? 'income' : 'expense';

  return {
    userId,
    walletId,
    item: pluggyTx.description || pluggyTx.descriptionRaw || 'Transação importada',
    amount: Math.abs(pluggyTx.amount),
    type,
    category: mapCategory(pluggyTx.category),
    date: pluggyTx.date,
    metadata: {
      source: 'pluggy',
      pluggyTransactionId: pluggyTx.id,
      pluggyAccountId: pluggyTx.accountId,
      originalDescription: pluggyTx.descriptionRaw,
      pluggyCategory: pluggyTx.category,
      merchant: pluggyTx.merchant?.name,
    },
  };
}

// Metadata type for imported transactions
interface ImportedTransactionMetadata {
  source: 'pluggy';
  pluggyTransactionId: string;
  pluggyAccountId: string;
  originalDescription?: string;
  pluggyCategory?: string;
  merchant?: string;
}

/**
 * GET /api/pluggy/transactions
 * Fetch transactions from a Pluggy account
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    const pluggyService = getPluggyService();
    const response = await pluggyService.listTransactions(accountId, {
      from: from || undefined,
      to: to || undefined,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error listing Pluggy transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list transactions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pluggy/transactions
 * Import transactions from Pluggy to the app
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, userId, walletId, from, to, transactionIds } = body;

    if (!accountId || !userId || !walletId) {
      return NextResponse.json(
        { error: 'accountId, userId, and walletId are required' },
        { status: 400 }
      );
    }

    const pluggyService = getPluggyService();
    const { db } = await connectToDatabase();

    // Fetch transactions from Pluggy
    let allTransactions: PluggyTransaction[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await pluggyService.listTransactions(accountId, {
        from,
        to,
        page,
        pageSize: 100,
      });

      allTransactions = allTransactions.concat(response.results);
      hasMore = page < response.totalPages;
      page++;

      // Safety limit
      if (page > 10) break;
    }

    // Filter by specific IDs if provided
    if (transactionIds && transactionIds.length > 0) {
      allTransactions = allTransactions.filter((tx) =>
        transactionIds.includes(tx.id)
      );
    }

    // Check for already imported transactions by pluggyTransactionId
    const pluggyIds = allTransactions.map((tx) => tx.id);
    const existingTxsByPluggyId = await db
      .collection('transactions')
      .find({
        userId,
        'metadata.pluggyTransactionId': { $in: pluggyIds },
      })
      .toArray();

    const existingPluggyIds = new Set(
      existingTxsByPluggyId.map((tx) => tx.metadata?.pluggyTransactionId)
    );

    // Filter out already imported by pluggyTransactionId
    let transactionsToCheck = allTransactions.filter(
      (tx) => !existingPluggyIds.has(tx.id)
    );

    // For remaining transactions, check for duplicates by date+amount (catches reconnection duplicates)
    if (transactionsToCheck.length > 0) {
      const minDate = transactionsToCheck.reduce((min, tx) =>
        tx.date < min ? tx.date : min, transactionsToCheck[0].date
      );
      const maxDate = transactionsToCheck.reduce((max, tx) =>
        tx.date > max ? tx.date : max, transactionsToCheck[0].date
      );

      const walletTransactions = await db
        .collection('transactions')
        .find({
          userId,
          walletId,
          date: { $gte: minDate, $lte: maxDate }
        })
        .toArray();

      const existingSignatures = new Set(
        walletTransactions.map((tx) => {
          const txDate = new Date(tx.date).toISOString().split('T')[0];
          return `${txDate}|${Math.abs(tx.amount)}|${tx.type}`;
        })
      );

      transactionsToCheck = transactionsToCheck.filter((tx) => {
        const txDate = new Date(tx.date).toISOString().split('T')[0];
        const txType = tx.type === 'CREDIT' ? 'income' : 'expense';
        const signature = `${txDate}|${Math.abs(tx.amount)}|${txType}`;
        return !existingSignatures.has(signature);
      });
    }

    const newTransactions = transactionsToCheck;

    if (newTransactions.length === 0) {
      return NextResponse.json({
        imported: 0,
        skipped: allTransactions.length,
        message: 'Todas as transações já foram importadas anteriormente.',
      });
    }

    // Map and insert new transactions
    const mappedTransactions = newTransactions.map((tx) =>
      mapTransaction(tx, userId, walletId)
    );

    const result = await db.collection('transactions').insertMany(mappedTransactions);

    return NextResponse.json({
      imported: result.insertedCount,
      skipped: allTransactions.length - newTransactions.length,
      message: `${result.insertedCount} transações importadas com sucesso.`,
    });
  } catch (error: any) {
    console.error('Error importing Pluggy transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import transactions' },
      { status: 500 }
    );
  }
}

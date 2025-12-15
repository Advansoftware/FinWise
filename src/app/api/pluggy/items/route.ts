// src/app/api/pluggy/items/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getPluggyService, PluggyAccount, PluggyTransaction } from '@/services/pluggy';
import { connectToDatabase } from '@/lib/mongodb';
import { WalletType, TransactionCategory } from '@/lib/types';
import { ObjectId } from 'mongodb';

// ==================== HELPERS ====================

/**
 * Map Pluggy account type to Gastometria wallet type
 */
function mapAccountToWalletType(pluggyType: string): WalletType {
  const typeMap: Record<string, WalletType> = {
    'BANK': 'Conta Corrente',
    'CHECKING': 'Conta Corrente',
    'SAVINGS': 'Poupança',
    'CREDIT': 'Cartão de Crédito',
    'CREDIT_CARD': 'Cartão de Crédito',
    'INVESTMENT': 'Investimentos',
  };
  return typeMap[pluggyType?.toUpperCase()] || 'Outros';
}

/**
 * Map Pluggy category to Gastometria category
 */
function mapCategory(pluggyCategory?: string): TransactionCategory {
  if (!pluggyCategory) return 'Outros';

  const lowerCategory = pluggyCategory.toLowerCase();
  const categoryMap: Record<string, TransactionCategory> = {
    'food': 'Supermercado',
    'groceries': 'Supermercado',
    'supermarket': 'Supermercado',
    'restaurant': 'Restaurante',
    'restaurants': 'Restaurante',
    'transportation': 'Transporte',
    'transport': 'Transporte',
    'uber': 'Transporte',
    'taxi': 'Transporte',
    'gas': 'Transporte',
    'entertainment': 'Entretenimento',
    'leisure': 'Lazer',
    'shopping': 'Vestuário',
    'clothing': 'Vestuário',
    'health': 'Saúde',
    'pharmacy': 'Saúde',
    'education': 'Educação',
    'housing': 'Contas',
    'bills': 'Contas',
    'utilities': 'Contas',
    'transfer': 'Transferência',
    'income': 'Salário',
    'salary': 'Salário',
    'investment': 'Investimentos',
  };

  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerCategory.includes(key)) {
      return value;
    }
  }

  return 'Outros';
}

/**
 * Clean merchant/description names for readability
 */
function cleanMerchantName(description: string): string {
  if (!description) return 'Transação';

  // Common patterns to clean up
  const cleanupPatterns: [RegExp, string][] = [
    // Remove asterisks and extra spaces
    [/\s*\*\s*/g, ' '],
    // Clean up UBER patterns
    [/UBER\s*\*?\s*(TRIP|EATS)?/gi, 'Uber'],
    // Clean up iFood patterns
    [/IFOOD\s*\*?\s*[A-Z]*/gi, 'iFood'],
    // Clean up 99/Taxi apps
    [/99(APP|TAXI|POP)?/gi, '99'],
    // Remove city names at end
    [/\s+(SAO PAULO|RIO DE JANEIRO|BELO HORIZONTE|BRASIL|BR)\s*$/gi, ''],
    // Remove PAGTO ELETRO prefix
    [/^PAGTO\s*ELETRO\s*/gi, ''],
    // Remove PAG* prefix
    [/^PAG\*\s*/gi, ''],
    // Remove excessive whitespace
    [/\s+/g, ' '],
  ];

  let cleaned = description.toUpperCase();

  for (const [pattern, replacement] of cleanupPatterns) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // Title case
  cleaned = cleaned.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return cleaned.trim() || 'Transação';
}

// ==================== GET ====================

/**
 * GET /api/pluggy/items
 * List user's connected bank items
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get stored connections for this user
    const connections = await db
      .collection('pluggy_connections')
      .find({ userId })
      .toArray();

    if (connections.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Fetch current item status from Pluggy
    const pluggyService = getPluggyService();
    const items = await Promise.all(
      connections.map(async (conn) => {
        try {
          const item = await pluggyService.getItem(conn.itemId);
          return {
            ...item,
            storedAt: conn.createdAt,
          };
        } catch (error) {
          // Item may have been deleted from Pluggy
          console.warn(`Failed to fetch item ${conn.itemId}:`, error);
          return null;
        }
      })
    );

    return NextResponse.json({
      items: items.filter(Boolean),
    });
  } catch (error: any) {
    console.error('Error listing Pluggy items:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list items' },
      { status: 500 }
    );
  }
}

// ==================== POST ====================

/**
 * POST /api/pluggy/items
 * Store a new item connection after successful widget flow
 * Also creates wallets and imports initial transactions (boot sync)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, userId } = body;

    if (!itemId || !userId) {
      return NextResponse.json(
        { error: 'itemId and userId are required' },
        { status: 400 }
      );
    }

    const pluggyService = getPluggyService();
    const { db } = await connectToDatabase();

    // 1. Verify item exists and get details
    const item = await pluggyService.getItem(itemId);
    console.log(`[Pluggy] Connected item ${itemId} for user ${userId}: ${item.connector.name}`);

    // 2. Store connection
    const connection = {
      itemId,
      userId,
      connectorId: item.connector.id,
      connectorName: item.connector.name,
      connectorImageUrl: item.connector.imageUrl,
      status: item.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('pluggy_connections').updateOne(
      { itemId, userId },
      { $set: connection },
      { upsert: true }
    );

    // 3. Fetch accounts and auto-create wallets
    const accounts = await pluggyService.listAccounts(itemId);
    const createdWallets: any[] = [];

    for (const account of accounts) {
      // Check if wallet already exists for this Pluggy account
      const existingWallet = await db.collection('wallets').findOne({
        userId,
        'metadata.pluggyAccountId': account.id,
      });

      if (!existingWallet) {
        const walletName = account.name || `${item.connector.name} - ${account.type}`;
        const wallet = {
          userId,
          name: walletName,
          type: mapAccountToWalletType(account.type),
          balance: account.balance || 0,
          createdAt: new Date().toISOString(),
          metadata: {
            source: 'pluggy',
            pluggyAccountId: account.id,
            pluggyItemId: itemId,
            connectorName: item.connector.name,
          },
        };

        const result = await db.collection('wallets').insertOne(wallet);
        createdWallets.push({ ...wallet, id: result.insertedId.toString() });
        console.log(`[Pluggy] Created wallet "${walletName}" for account ${account.id}`);
      }
    }

    // 4. Boot sync: Import last 30 days of transactions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
    const toDate = new Date().toISOString().split('T')[0];

    let totalImported = 0;

    for (const account of accounts) {
      // Find or get the wallet for this account
      const wallet = await db.collection('wallets').findOne({
        userId,
        'metadata.pluggyAccountId': account.id,
      });

      if (!wallet) continue;

      // Fetch transactions
      let allTransactions: PluggyTransaction[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 5) { // Limit to 5 pages for boot sync
        const response = await pluggyService.listTransactions(account.id, {
          from: fromDate,
          to: toDate,
          page,
          pageSize: 100,
        });

        allTransactions = allTransactions.concat(response.results);
        hasMore = page < response.totalPages;
        page++;
      }

      if (allTransactions.length === 0) continue;

      // Check for duplicates
      const pluggyIds = allTransactions.map((tx) => tx.id);
      const existingTxs = await db
        .collection('transactions')
        .find({
          userId,
          'metadata.pluggyTransactionId': { $in: pluggyIds },
        })
        .toArray();

      const existingIds = new Set(
        existingTxs.map((tx) => tx.metadata?.pluggyTransactionId)
      );

      // Filter and map new transactions
      const newTransactions = allTransactions
        .filter((tx) => !existingIds.has(tx.id))
        .map((tx) => ({
          userId,
          walletId: wallet._id.toString(),
          item: cleanMerchantName(tx.description || tx.descriptionRaw || ''),
          amount: Math.abs(tx.amount),
          type: tx.type === 'CREDIT' ? 'income' : 'expense',
          category: mapCategory(tx.category),
          date: tx.date,
          metadata: {
            source: 'pluggy',
            pluggyTransactionId: tx.id,
            pluggyAccountId: account.id,
            originalDescription: tx.descriptionRaw,
            pluggyCategory: tx.category,
            merchant: tx.merchant?.name,
          },
        }));

      if (newTransactions.length > 0) {
        await db.collection('transactions').insertMany(newTransactions);
        totalImported += newTransactions.length;
        console.log(`[Pluggy] Imported ${newTransactions.length} transactions for account ${account.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      item,
      connection,
      walletsCreated: createdWallets.length,
      transactionsImported: totalImported,
      accounts: accounts.length,
    });
  } catch (error: any) {
    console.error('Error storing Pluggy item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to store item' },
      { status: 500 }
    );
  }
}

// ==================== DELETE ====================

/**
 * DELETE /api/pluggy/items
 * Disconnect a bank item
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const userId = searchParams.get('userId');

    if (!itemId || !userId) {
      return NextResponse.json(
        { error: 'itemId and userId are required' },
        { status: 400 }
      );
    }

    const pluggyService = getPluggyService();

    // Delete from Pluggy
    try {
      await pluggyService.deleteItem(itemId);
    } catch (error) {
      console.warn(`Failed to delete item ${itemId} from Pluggy:`, error);
      // Continue to remove from our DB anyway
    }

    const { db } = await connectToDatabase();

    // Remove connection from our DB (keep wallets and transactions)
    await db.collection('pluggy_connections').deleteOne({ itemId, userId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting Pluggy item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete item' },
      { status: 500 }
    );
  }
}

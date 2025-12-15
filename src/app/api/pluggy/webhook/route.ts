// src/app/api/pluggy/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getPluggyService, PluggyWebhookPayload, PluggyTransaction } from '@/services/pluggy';
import { TransactionCategory } from '@/lib/types';

// ==================== HELPERS ====================

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

  const cleanupPatterns: [RegExp, string][] = [
    [/\s*\*\s*/g, ' '],
    [/UBER\s*\*?\s*(TRIP|EATS)?/gi, 'Uber'],
    [/IFOOD\s*\*?\s*[A-Z]*/gi, 'iFood'],
    [/99(APP|TAXI|POP)?/gi, '99'],
    [/\s+(SAO PAULO|RIO DE JANEIRO|BELO HORIZONTE|BRASIL|BR)\s*$/gi, ''],
    [/^PAGTO\s*ELETRO\s*/gi, ''],
    [/^PAG\*\s*/gi, ''],
    [/\s+/g, ' '],
  ];

  let cleaned = description.toUpperCase();

  for (const [pattern, replacement] of cleanupPatterns) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  cleaned = cleaned.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return cleaned.trim() || 'Transação';
}

// ==================== WEBHOOK HANDLER ====================

/**
 * POST /api/pluggy/webhook
 * Handle Pluggy webhook notifications
 */
export async function POST(request: NextRequest) {
  try {
    const payload: PluggyWebhookPayload = await request.json();

    console.log('[Pluggy Webhook] Received:', payload.event, payload.id || payload.itemId);

    const { db } = await connectToDatabase();

    switch (payload.event) {
      // ==================== ITEM EVENTS ====================
      case 'item/updated':
      case 'item/created':
        if (payload.itemId) {
          await db.collection('pluggy_connections').updateOne(
            { itemId: payload.itemId },
            {
              $set: {
                status: payload.data?.status || 'UPDATED',
                lastSyncedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            }
          );
        }
        break;

      case 'item/error':
      case 'item/login_succeeded':
        if (payload.itemId) {
          await db.collection('pluggy_connections').updateOne(
            { itemId: payload.itemId },
            {
              $set: {
                status: payload.event === 'item/error' ? 'LOGIN_ERROR' : 'UPDATED',
                error: payload.data?.error,
                updatedAt: new Date().toISOString(),
              }
            }
          );
        }
        break;

      case 'item/deleted':
        if (payload.itemId) {
          await db.collection('pluggy_connections').deleteOne({ itemId: payload.itemId });
        }
        break;

      // ==================== TRANSACTIONS EVENTS ====================
      case 'transactions/created':
      case 'transactions/updated':
        // New transactions detected! Import them automatically
        if (payload.itemId) {
          await handleNewTransactions(db, payload.itemId);
        }
        break;

      // ==================== PAYMENT EVENTS ====================
      case 'payment_intent/completed':
        if (payload.id) {
          await db.collection('pluggy_payments').updateOne(
            { paymentRequestId: payload.id },
            {
              $set: {
                status: 'COMPLETED',
                completedAt: payload.triggeredAt,
                updatedAt: new Date().toISOString(),
              }
            }
          );

          // Find associated installment and mark as paid
          const payment = await db.collection('pluggy_payments').findOne({
            paymentRequestId: payload.id,
          });

          if (payment?.installmentId) {
            console.log('[Pluggy Webhook] Payment completed for installment:', payment.installmentId);
            // TODO: Mark installment as paid in the installments system
          }
        }
        break;

      case 'payment_intent/error':
        if (payload.id) {
          await db.collection('pluggy_payments').updateOne(
            { paymentRequestId: payload.id },
            {
              $set: {
                status: 'ERROR',
                error: payload.data?.error,
                updatedAt: new Date().toISOString(),
              }
            }
          );
        }
        break;

      default:
        console.log('[Pluggy Webhook] Unhandled event:', payload.event);
    }

    // Store webhook for auditing
    await db.collection('pluggy_webhooks').insertOne({
      ...payload,
      processedAt: new Date().toISOString(),
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Pluggy Webhook] Error:', error);
    // Return 200 anyway to acknowledge receipt
    return NextResponse.json({
      received: true,
      error: error.message,
    });
  }
}

// ==================== TRANSACTION SYNC HELPER ====================

/**
 * Handle new transactions webhook - sync recent transactions for an item
 */
async function handleNewTransactions(db: any, itemId: string) {
  try {
    // Find the connection with userId
    const connection = await db.collection('pluggy_connections').findOne({ itemId });

    if (!connection) {
      console.warn(`[Pluggy Webhook] No connection found for item ${itemId}`);
      return;
    }

    const userId = connection.userId;
    const pluggyService = getPluggyService();

    // Get accounts for this item
    const accounts = await pluggyService.listAccounts(itemId);

    // Fetch transactions from last 7 days (for webhook updates)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromDate = sevenDaysAgo.toISOString().split('T')[0];
    const toDate = new Date().toISOString().split('T')[0];

    let totalImported = 0;

    for (const account of accounts) {
      // Find wallet for this account
      const wallet = await db.collection('wallets').findOne({
        userId,
        'metadata.pluggyAccountId': account.id,
      });

      if (!wallet) {
        console.warn(`[Pluggy Webhook] No wallet found for account ${account.id}`);
        continue;
      }

      // Fetch recent transactions
      const response = await pluggyService.listTransactions(account.id, {
        from: fromDate,
        to: toDate,
        pageSize: 100,
      });

      if (response.results.length === 0) continue;

      // Check for duplicates
      const pluggyIds = response.results.map((tx: PluggyTransaction) => tx.id);
      const existingTxs = await db
        .collection('transactions')
        .find({
          userId,
          'metadata.pluggyTransactionId': { $in: pluggyIds },
        })
        .toArray();

      const existingIds = new Set(
        existingTxs.map((tx: any) => tx.metadata?.pluggyTransactionId)
      );

      // Filter and map new transactions
      const newTransactions = response.results
        .filter((tx: PluggyTransaction) => !existingIds.has(tx.id))
        .map((tx: PluggyTransaction) => ({
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
        console.log(`[Pluggy Webhook] Imported ${newTransactions.length} new transactions for account ${account.id}`);
      }
    }

    // Update connection last sync time
    await db.collection('pluggy_connections').updateOne(
      { itemId },
      {
        $set: {
          lastSyncedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }
    );

    console.log(`[Pluggy Webhook] Total imported for item ${itemId}: ${totalImported} transactions`);
  } catch (error) {
    console.error(`[Pluggy Webhook] Error handling transactions for item ${itemId}:`, error);
  }
}

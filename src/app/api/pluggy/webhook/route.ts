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
          await handlePaymentCompleted(db, payload.id, payload.triggeredAt);
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

// ==================== PAYMENT COMPLETED HELPER ====================

/**
 * Handle payment completed - register transaction and update wallet/installment
 */
async function handlePaymentCompleted(db: any, paymentRequestId: string, completedAt?: string) {
  try {
    // Update payment status
    await db.collection('pluggy_payments').updateOne(
      { paymentRequestId },
      {
        $set: {
          status: 'COMPLETED',
          completedAt: completedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }
    );

    // Find the payment record
    const payment = await db.collection('pluggy_payments').findOne({ paymentRequestId });

    if (!payment) {
      console.warn(`[Pluggy Webhook] Payment record not found for ${paymentRequestId}`);
      return;
    }

    const { userId, amount, description, installmentId } = payment;
    const now = new Date().toISOString();

    console.log(`[Pluggy Webhook] Processing payment completion: amount=${amount}, installmentId=${installmentId}`);

    // Find the user's default wallet or the wallet linked to the installment
    let walletId: string | null = null;
    let installment: any = null;

    if (installmentId) {
      // Get the installment to find the source wallet
      const { ObjectId } = await import('mongodb');
      installment = await db.collection('installments').findOne({
        _id: new ObjectId(installmentId),
      });

      if (installment?.sourceWalletId) {
        walletId = installment.sourceWalletId;
      }
    }

    // Fallback to user's primary wallet if no specific wallet found
    if (!walletId) {
      const primaryWallet = await db.collection('wallets').findOne({
        userId,
        isPrimary: true,
      });
      walletId = primaryWallet?._id?.toString() || null;
    }

    // If still no wallet, get any wallet of the user
    if (!walletId) {
      const anyWallet = await db.collection('wallets').findOne({ userId });
      walletId = anyWallet?._id?.toString() || null;
    }

    if (!walletId) {
      console.error(`[Pluggy Webhook] No wallet found for user ${userId}`);
      return;
    }

    // 1. Create the transaction record
    const transactionData = {
      userId,
      walletId,
      item: description || 'Pagamento PIX via Open Finance',
      amount: amount,
      type: 'expense',
      category: installment?.category || 'Transferência',
      subcategory: installment?.subcategory,
      date: completedAt || now,
      metadata: {
        source: 'pluggy_payment',
        pluggyPaymentRequestId: paymentRequestId,
        installmentId: installmentId || undefined,
        installmentNumber: undefined as number | undefined,
      },
      createdAt: now,
      updatedAt: now,
    };

    // If linked to an installment, add more details
    if (installment) {
      const nextPayment = installment.payments?.find(
        (p: any) => p.status === 'pending' || p.status === 'overdue'
      );
      if (nextPayment) {
        transactionData.metadata.installmentNumber = nextPayment.installmentNumber;
        transactionData.item = `Parcela ${nextPayment.installmentNumber}/${installment.totalInstallments} - ${installment.name}`;
      }
    }

    const transactionResult = await db.collection('transactions').insertOne(transactionData);
    const transactionId = transactionResult.insertedId.toString();

    console.log(`[Pluggy Webhook] Created transaction ${transactionId}`);

    // 2. Update wallet balance
    const { ObjectId } = await import('mongodb');
    await db.collection('wallets').updateOne(
      { _id: new ObjectId(walletId) },
      {
        $inc: { balance: -amount },
        $set: { updatedAt: now },
      }
    );

    console.log(`[Pluggy Webhook] Updated wallet ${walletId} balance (-${amount})`);

    // 3. If linked to an installment, mark the next payment as paid
    if (installmentId && installment) {
      const payments = installment.payments || [];
      const nextPaymentIndex = payments.findIndex(
        (p: any) => p.status === 'pending' || p.status === 'overdue'
      );

      if (nextPaymentIndex !== -1) {
        const updatePath = `payments.${nextPaymentIndex}`;
        await db.collection('installments').updateOne(
          { _id: new ObjectId(installmentId) },
          {
            $set: {
              [`${updatePath}.status`]: 'paid',
              [`${updatePath}.paidAmount`]: amount,
              [`${updatePath}.paidDate`]: completedAt || now,
              [`${updatePath}.transactionId`]: transactionId,
              updatedAt: now,
            }
          }
        );

        console.log(`[Pluggy Webhook] Marked installment ${installmentId} payment ${nextPaymentIndex + 1} as paid`);
      }
    }

    // 4. Update the pluggy_payment record with transactionId
    await db.collection('pluggy_payments').updateOne(
      { paymentRequestId },
      {
        $set: {
          transactionId,
          walletId,
          updatedAt: now,
        }
      }
    );

    console.log(`[Pluggy Webhook] Payment ${paymentRequestId} fully processed`);
  } catch (error) {
    console.error(`[Pluggy Webhook] Error handling payment completed for ${paymentRequestId}:`, error);
  }
}

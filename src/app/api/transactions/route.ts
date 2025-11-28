// src/app/api/transactions/route.ts

import {NextRequest, NextResponse} from 'next/server';
import {connectToDatabase} from '@/lib/mongodb';
import {ObjectId} from 'mongodb';
import {WalletBalanceService} from '@/services/wallet-balance-service';
import {Transaction} from '@/lib/types';

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (userId && ObjectId.isValid(userId)) {
    return userId;
  }
  return null;
}

// GET - Buscar todas as transações do usuário
export async function GET(request: NextRequest) {
  const authenticatedUserId = await getUserIdFromRequest(request);
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing user identifier.' }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    const transactions = await db.collection('transactions')
      .find({ userId: authenticatedUserId })
      .toArray();

    // Convert _id to id string for frontend compatibility
    const formattedTransactions = transactions.map(transaction => ({
      ...transaction,
      id: transaction._id.toString(),
      _id: undefined // Remove _id to avoid confusion
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Criar nova transação com atualização automática da carteira
export async function POST(request: NextRequest) {
  const authenticatedUserId = await getUserIdFromRequest(request);
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing user identifier.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { db } = await connectToDatabase();

    // Criar a transação no MongoDB
    const transactionToInsert = {
      ...body,
      userId: authenticatedUserId,
      createdAt: new Date()
    };

    const result = await db.collection('transactions').insertOne(transactionToInsert);

    // Obter a transação criada com o ID
    const createdTransaction = {
      ...transactionToInsert,
      id: result.insertedId.toString(),
      _id: result.insertedId
    } as Transaction;

    // Atualizar saldo da carteira
    await WalletBalanceService.updateBalanceForTransaction(createdTransaction, authenticatedUserId);

    return NextResponse.json({
      insertedId: result.insertedId,
      transaction: createdTransaction
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
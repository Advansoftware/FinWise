// src/app/api/transactions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { WalletBalanceService } from '@/services/wallet-balance-service';
import { Transaction } from '@/lib/types';

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (userId && ObjectId.isValid(userId)) {
    return userId;
  }
  return null;
}

// GET - Buscar transações do usuário (com paginação opcional)
export async function GET(request: NextRequest) {
  const authenticatedUserId = await getUserIdFromRequest(request);
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing user identifier.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '0');
    const cursor = searchParams.get('cursor'); // ID da última transação
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');

    const { db } = await connectToDatabase();

    // Build query
    const query: any = {
      userId: authenticatedUserId,
      parentId: { $exists: false } // Não incluir transações filhas
    };

    // Cursor-based pagination
    if (cursor && ObjectId.isValid(cursor)) {
      query._id = { $lt: new ObjectId(cursor) };
    }

    // Date filter
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = dateFrom;
      if (dateTo) query.date.$lte = dateTo;
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Subcategory filter
    if (subcategory && subcategory !== 'all') {
      query.subcategory = subcategory;
    }

    // Se limit > 0, usar paginação, senão retornar todas
    let transactionsQuery = db.collection('transactions')
      .find(query)
      .sort({ date: -1, _id: -1 });

    if (limit > 0) {
      transactionsQuery = transactionsQuery.limit(limit + 1); // +1 para verificar se há mais
    }

    const transactions = await transactionsQuery.toArray();

    // Check if there are more results
    let hasMore = false;
    let nextCursor: string | null = null;

    if (limit > 0 && transactions.length > limit) {
      hasMore = true;
      transactions.pop(); // Remove o item extra
      nextCursor = transactions[transactions.length - 1]._id.toString();
    } else if (limit > 0 && transactions.length === limit && transactions.length > 0) {
      // Pode ter mais, verificar pegando o cursor
      nextCursor = transactions[transactions.length - 1]._id.toString();
      // Fazer uma query rápida para ver se há mais
      const moreExists = await db.collection('transactions')
        .findOne({
          ...query,
          _id: { $lt: new ObjectId(nextCursor) }
        });
      hasMore = !!moreExists;
    }

    // Convert _id to id string for frontend compatibility
    const formattedTransactions = transactions.map(transaction => ({
      ...transaction,
      id: transaction._id.toString(),
      _id: undefined // Remove _id to avoid confusion
    }));

    // Se usar paginação, retornar objeto com metadata
    if (limit > 0) {
      return NextResponse.json({
        transactions: formattedTransactions,
        nextCursor,
        hasMore
      });
    }

    // Compatibilidade com chamadas antigas (sem paginação)
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
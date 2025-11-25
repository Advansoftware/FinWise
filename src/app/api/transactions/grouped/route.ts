// src/app/api/transactions/grouped/route.ts

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

// POST - Criar transação agrupada (pai + filhos)
export async function POST(request: NextRequest) {
  const authenticatedUserId = await getUserIdFromRequest(request);
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing user identifier.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { parent, children } = body;

    if (!parent || !children || !Array.isArray(children)) {
      return NextResponse.json({ error: 'Invalid request body. Expected parent and children array.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Calcula o valor total dos filhos
    const totalAmount = children.reduce(
      (sum: number, child: any) => sum + (child.amount * (child.quantity || 1)),
      0
    );

    // Criar a transação pai
    const parentToInsert = {
      ...parent,
      userId: authenticatedUserId,
      amount: totalAmount,
      hasChildren: true,
      childrenCount: children.length,
      createdAt: new Date()
    };

    const parentResult = await db.collection('transactions').insertOne(parentToInsert);
    const parentId = parentResult.insertedId.toString();

    // Criar as transações filhas vinculadas ao pai
    const childrenToInsert = children.map((child: any) => ({
      ...child,
      userId: authenticatedUserId,
      parentId: parentId,
      createdAt: new Date()
    }));

    if (childrenToInsert.length > 0) {
      await db.collection('transactions').insertMany(childrenToInsert);
    }

    // Obter a transação pai criada com o ID
    const createdTransaction = {
      ...parentToInsert,
      id: parentId,
      _id: parentResult.insertedId
    } as Transaction;

    // Atualizar saldo da carteira (apenas com a transação pai que tem o total)
    await WalletBalanceService.updateBalanceForTransaction(createdTransaction, authenticatedUserId);

    return NextResponse.json({
      insertedId: parentResult.insertedId,
      transaction: createdTransaction,
      childrenCount: children.length
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating grouped transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

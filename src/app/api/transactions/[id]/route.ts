// src/app/api/transactions/[id]/route.ts

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

// GET - Buscar transação específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authenticatedUserId = await getUserIdFromRequest(request);
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing user identifier.' }, { status: 401 });
  }

  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid transaction ID format' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const transaction = await db.collection('transactions').findOne({
      _id: new ObjectId(params.id),
      userId: authenticatedUserId
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Convert _id to id string for frontend compatibility
    const formattedTransaction = {
      ...transaction,
      id: transaction._id.toString(),
      _id: undefined // Remove _id to avoid confusion
    };

    return NextResponse.json(formattedTransaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT - Atualizar transação com reversão e aplicação do saldo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authenticatedUserId = await getUserIdFromRequest(request);
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing user identifier.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { updates, originalTransaction } = body;
    const { db } = await connectToDatabase();

    // Validate ObjectId format
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid transaction ID format' }, { status: 400 });
    }

    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = await db.collection('transactions').findOne({
      _id: new ObjectId(params.id),
      userId: authenticatedUserId
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Reverter o saldo da transação original
    if (originalTransaction) {
      await WalletBalanceService.revertBalanceForTransaction(originalTransaction, authenticatedUserId);
    }

    // Atualizar a transação no MongoDB
    const updatedData = { ...updates };
    delete updatedData.userId; // Prevent user from changing ownership
    delete updatedData._id;

    const result = await db.collection('transactions').updateOne(
      { _id: new ObjectId(params.id), userId: authenticatedUserId },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Obter a transação atualizada
    const updatedTransaction = await db.collection('transactions').findOne({
      _id: new ObjectId(params.id)
    });

    // Aplicar o novo saldo
    if (updatedTransaction) {
      const transactionWithId = {
        ...updatedTransaction,
        id: updatedTransaction._id.toString()
      } as unknown as Transaction;

      await WalletBalanceService.updateBalanceForTransaction(transactionWithId, authenticatedUserId);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE - Remover transação com reversão do saldo (e filhos se houver)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authenticatedUserId = await getUserIdFromRequest(request);
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing user identifier.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const transactionToDelete = body as Transaction;

    // Validate ObjectId format
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid transaction ID format' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = await db.collection('transactions').findOne({
      _id: new ObjectId(params.id),
      userId: authenticatedUserId
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Reverter o saldo da carteira antes de deletar
    if (existingTransaction) {
      // Extract only the fields needed for wallet balance operations
      const transactionForBalance = {
        walletId: existingTransaction.walletId,
        toWalletId: existingTransaction.toWalletId,
        type: existingTransaction.type,
        amount: existingTransaction.amount,
        userId: existingTransaction.userId
      } as Pick<Transaction, 'walletId' | 'toWalletId' | 'type' | 'amount' | 'userId'>;

      await WalletBalanceService.revertBalanceForTransaction(transactionForBalance as Transaction, authenticatedUserId);
    }

    // Se a transação tem filhos, deletar os filhos primeiro
    if (existingTransaction.hasChildren) {
      await db.collection('transactions').deleteMany({
        parentId: params.id,
        userId: authenticatedUserId
      });
    }

    // Deletar a transação
    const result = await db.collection('transactions').deleteOne({
      _id: new ObjectId(params.id),
      userId: authenticatedUserId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
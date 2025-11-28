// src/app/api/transactions/[id]/children/route.ts

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

// Recalcula e atualiza o valor do pai baseado na soma das filhas
async function recalculateParentAmount(db: any, parentId: string, userId: string) {
  const children = await db.collection('transactions')
    .find({ parentId, userId })
    .toArray();

  const totalAmount = children.reduce(
    (sum: number, child: any) => sum + (child.amount * (child.quantity || 1)),
    0
  );

  const hasChildren = children.length > 0;

  await db.collection('transactions').updateOne(
    { _id: new ObjectId(parentId), userId },
    {
      $set: {
        amount: hasChildren ? totalAmount : undefined, // Keep original if no children
        hasChildren,
        childrenCount: children.length,
      }
    }
  );

  return { totalAmount, hasChildren, childrenCount: children.length };
}

// GET - Buscar transações filhas de uma transação pai
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authenticatedUserId = await getUserIdFromRequest(request);
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing user identifier.' }, { status: 401 });
  }

  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid transaction ID format' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Buscar transações filhas pelo parentId
    const children = await db.collection('transactions')
      .find({
        parentId: params.id,
        userId: authenticatedUserId
      })
      .sort({ item: 1 })
      .toArray();

    const formattedChildren = children.map(transaction => ({
      ...transaction,
      id: transaction._id.toString(),
      _id: undefined
    }));

    return NextResponse.json(formattedChildren);
  } catch (error) {
    console.error('Error fetching child transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Adicionar nova transação filha
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authenticatedUserId = await getUserIdFromRequest(request);
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing user identifier.' }, { status: 401 });
  }

  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid transaction ID format' }, { status: 400 });
    }

    const body = await request.json();
    const { db } = await connectToDatabase();

    // Verificar se o pai existe
    const parentTransaction = await db.collection('transactions').findOne({
      _id: new ObjectId(params.id),
      userId: authenticatedUserId
    });

    if (!parentTransaction) {
      return NextResponse.json({ error: 'Parent transaction not found' }, { status: 404 });
    }

    // Obter valor original do pai antes de adicionar a filha (para reverter o saldo)
    const originalParentAmount = parentTransaction.amount;
    const hadChildren = parentTransaction.hasChildren;

    // Criar transação filha
    const childToInsert = {
      ...body,
      userId: authenticatedUserId,
      parentId: params.id,
      createdAt: new Date()
    };

    const result = await db.collection('transactions').insertOne(childToInsert);

    // Recalcular valor do pai
    const { totalAmount } = await recalculateParentAmount(db, params.id, authenticatedUserId);

    // Atualizar saldo da carteira
    // Se o pai já tinha filhas, reverter o valor antigo e aplicar o novo
    // Se não tinha, reverter o valor original do pai e aplicar a soma das filhas
    const transactionForWallet = {
      id: params.id,
      userId: authenticatedUserId,
      walletId: parentTransaction.walletId,
      type: parentTransaction.type,
      amount: 0,
      date: parentTransaction.date,
      item: parentTransaction.item,
      category: parentTransaction.category,
    } as Transaction;

    if (hadChildren) {
      // Reverter valor antigo do pai
      await WalletBalanceService.revertBalanceForTransaction(
        { ...transactionForWallet, amount: originalParentAmount },
        authenticatedUserId
      );
    } else {
      // Reverter valor original do pai (era uma transação simples)
      await WalletBalanceService.revertBalanceForTransaction(
        { ...transactionForWallet, amount: originalParentAmount },
        authenticatedUserId
      );
    }

    // Aplicar novo valor total
    await WalletBalanceService.updateBalanceForTransaction(
      { ...transactionForWallet, amount: totalAmount },
      authenticatedUserId
    );

    return NextResponse.json({
      insertedId: result.insertedId,
      child: { ...childToInsert, id: result.insertedId.toString() }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating child transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT - Atualizar transação filha
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authenticatedUserId = await getUserIdFromRequest(request);
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing user identifier.' }, { status: 401 });
  }

  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid parent transaction ID format' }, { status: 400 });
    }

    const body = await request.json();
    const { updates, childId } = body;

    if (!childId || !ObjectId.isValid(childId)) {
      return NextResponse.json({ error: 'Invalid child transaction ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Verificar se o pai existe
    const parentTransaction = await db.collection('transactions').findOne({
      _id: new ObjectId(params.id),
      userId: authenticatedUserId
    });

    if (!parentTransaction) {
      return NextResponse.json({ error: 'Parent transaction not found' }, { status: 404 });
    }

    const originalParentAmount = parentTransaction.amount;

    // Atualizar a filha
    const updatedData = { ...updates };
    delete updatedData.userId;
    delete updatedData._id;
    delete updatedData.parentId;

    await db.collection('transactions').updateOne(
      { _id: new ObjectId(childId), parentId: params.id, userId: authenticatedUserId },
      { $set: updatedData }
    );

    // Recalcular valor do pai
    const { totalAmount } = await recalculateParentAmount(db, params.id, authenticatedUserId);

    // Atualizar saldo (reverter antigo, aplicar novo)
    const transactionForWallet = {
      id: params.id,
      userId: authenticatedUserId,
      walletId: parentTransaction.walletId,
      type: parentTransaction.type,
      amount: 0,
      date: parentTransaction.date,
      item: parentTransaction.item,
      category: parentTransaction.category,
    } as Transaction;

    await WalletBalanceService.revertBalanceForTransaction(
      { ...transactionForWallet, amount: originalParentAmount },
      authenticatedUserId
    );
    await WalletBalanceService.updateBalanceForTransaction(
      { ...transactionForWallet, amount: totalAmount },
      authenticatedUserId
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating child transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE - Remover transação filha
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authenticatedUserId = await getUserIdFromRequest(request);
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing user identifier.' }, { status: 401 });
  }

  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid parent transaction ID format' }, { status: 400 });
    }

    const body = await request.json();
    const { childId } = body;

    if (!childId || !ObjectId.isValid(childId)) {
      return NextResponse.json({ error: 'Invalid child transaction ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Verificar se o pai existe
    const parentTransaction = await db.collection('transactions').findOne({
      _id: new ObjectId(params.id),
      userId: authenticatedUserId
    });

    if (!parentTransaction) {
      return NextResponse.json({ error: 'Parent transaction not found' }, { status: 404 });
    }

    const originalParentAmount = parentTransaction.amount;

    // Deletar a filha
    await db.collection('transactions').deleteOne({
      _id: new ObjectId(childId),
      parentId: params.id,
      userId: authenticatedUserId
    });

    // Recalcular valor do pai
    const { totalAmount, hasChildren } = await recalculateParentAmount(db, params.id, authenticatedUserId);

    // Atualizar saldo
    const transactionForWallet = {
      id: params.id,
      userId: authenticatedUserId,
      walletId: parentTransaction.walletId,
      type: parentTransaction.type,
      amount: 0,
      date: parentTransaction.date,
      item: parentTransaction.item,
      category: parentTransaction.category,
    } as Transaction;

    await WalletBalanceService.revertBalanceForTransaction(
      { ...transactionForWallet, amount: originalParentAmount },
      authenticatedUserId
    );

    // Se ainda tem filhas, aplicar nova soma; senão o pai volta a ser o valor original
    const finalAmount = hasChildren ? totalAmount : parentTransaction.amount;
    await WalletBalanceService.updateBalanceForTransaction(
      { ...transactionForWallet, amount: finalAmount },
      authenticatedUserId
    );

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('Error deleting child transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";
import { Transaction } from "@/lib/types";
import { WalletBalanceService } from "@/services/wallet-balance-service";

// GET /api/v1/transactions - List user's transactions
export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const { db } = await connectToDatabase();
    const transactions = await db.collection("transactions")
      .find({ userId: user.id })
      .sort({ date: -1 })
      .limit(100)
      .toArray();

    const formattedTransactions = transactions.map((t) => ({
      ...t,
      id: t._id.toString(),
      _id: undefined,
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/v1/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const body = await request.json();
    const { db } = await connectToDatabase();

    // Basic validation
    if (!body.amount || !body.category || !body.walletId) {
      return NextResponse.json({ error: "Missing required fields (amount, category, walletId)" }, { status: 400 });
    }

    const transactionToInsert = {
      ...body,
      userId: user.id,
      // Mapeia 'description' do mobile para 'item' da web (compatibilidade)
      item: body.item || body.description || 'Sem descrição',
      amount: Number(body.amount),
      date: body.date || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const result = await db.collection("transactions").insertOne(transactionToInsert);

    const createdTransaction = {
      ...transactionToInsert,
      id: result.insertedId.toString(),
      _id: result.insertedId
    } as Transaction;

    // Update wallet balance
    await WalletBalanceService.updateBalanceForTransaction(createdTransaction, user.id);

    return NextResponse.json({
      id: createdTransaction.id,
      transaction: createdTransaction
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

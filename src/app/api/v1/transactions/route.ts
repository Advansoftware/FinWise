import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";
import { Transaction } from "@/lib/types";
import { WalletBalanceService } from "@/services/wallet-balance-service";
import { SmartTransactionsService } from "@/services/smart-transactions-service";

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

    // Basic validation - se não tiver categoria, tenta sugerir inteligentemente
    if (!body.amount || !body.walletId) {
      return NextResponse.json({ error: "Missing required fields (amount, walletId)" }, { status: 400 });
    }

    let category = body.category;
    let walletId = body.walletId;
    let appliedSmartRule = false;

    // 🧠 Smart Transactions: Se não tiver categoria, busca sugestão inteligente
    if (!category && (body.item || body.establishment)) {
      const suggestions = await SmartTransactionsService.getSuggestions(
        user.id,
        body.item || '',
        body.establishment
      );

      if (suggestions.categories.length > 0 && suggestions.categories[0].confidence > 0.7) {
        category = suggestions.categories[0].category;
        appliedSmartRule = true;

        // Se a regra tiver carteira padrão e não foi especificada, usa
        if (suggestions.merchantRule?.defaultWalletId && !body.walletId) {
          walletId = suggestions.merchantRule.defaultWalletId;
        }

        // Incrementa contador de uso da regra
        if (suggestions.merchantRule) {
          await SmartTransactionsService.incrementRuleMatchCount(suggestions.merchantRule.id);
        }
      }
    }

    // Se ainda não tem categoria, usa "Outros"
    if (!category) {
      category = 'Outros';
    }

    const transactionToInsert = {
      ...body,
      userId: user.id,
      category,
      walletId,
      amount: Number(body.amount),
      date: body.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      smartCategorized: appliedSmartRule, // Flag para indicar categorização inteligente
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
      transaction: createdTransaction,
      smartCategorized: appliedSmartRule, // Informa se foi categorizado automaticamente
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

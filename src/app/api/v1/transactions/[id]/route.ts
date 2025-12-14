import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";
import { ObjectId } from "mongodb";
import { Transaction } from "@/lib/types";
import { WalletBalanceService } from "@/services/wallet-balance-service";

// GET /api/v1/transactions/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) return NextResponse.json({ error: authResult.error }, { status: 401 });
  const user = authResult.user;
  const { id } = await params;

  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const { db } = await connectToDatabase();
    const tx = await db.collection("transactions").findOne({ _id: new ObjectId(id), userId: user.id });
    if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    return NextResponse.json({ ...tx, id: tx._id.toString(), _id: undefined });
  } catch (e) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// PUT /api/v1/transactions/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) return NextResponse.json({ error: authResult.error }, { status: 401 });
  const user = authResult.user;
  const { id } = await params;

  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const body = await request.json();
    const { db } = await connectToDatabase();

    // Find existing transaction to revert balance
    const existingTx = await db.collection("transactions").findOne({ _id: new ObjectId(id), userId: user.id });
    if (!existingTx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    // Full 'Transaction' object from DB
    const oldTransaction = { ...existingTx, id: existingTx._id.toString() } as unknown as Transaction;

    // Revert old balance effect
    await WalletBalanceService.revertBalanceForTransaction(oldTransaction, user.id);

    // Prepare new transaction data
    const updates: any = { ...body };
    delete updates._id;
    delete updates.userId; // user cannot change owner
    delete updates.id;

    // If amount changed, make sure it's number
    if (updates.amount) updates.amount = Number(updates.amount);

    // Update in DB
    await db.collection("transactions").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    // Determine new state for balance update
    const newTransaction = {
      ...oldTransaction,
      ...updates
    } as Transaction;

    // Apply new balance effect
    await WalletBalanceService.updateBalanceForTransaction(newTransaction, user.id);

    return NextResponse.json({ success: true, transaction: newTransaction });

  } catch (e) {
    console.error("Update tx error", e);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// DELETE /api/v1/transactions/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) return NextResponse.json({ error: authResult.error }, { status: 401 });
  const user = authResult.user;
  const { id } = await params;

  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const { db } = await connectToDatabase();
    const existingTx = await db.collection("transactions").findOne({ _id: new ObjectId(id), userId: user.id });
    if (!existingTx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    const oldTransaction = { ...existingTx, id: existingTx._id.toString() } as unknown as Transaction;

    // Revert balance
    await WalletBalanceService.revertBalanceForTransaction(oldTransaction, user.id);

    // Delete
    await db.collection("transactions").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: "Transaction deleted" });
  } catch (e) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

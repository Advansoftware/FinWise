// src/app/api/v1/goals/[id]/deposit/route.ts
// Add deposit to a goal

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";
import { ObjectId } from "mongodb";

// POST /api/v1/goals/[id]/deposit - Add deposit to goal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { amount } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Amount is required and must be positive" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const goal = await db.collection("goals").findOne({
      _id: new ObjectId(id),
      userId: user.id
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const newCurrentAmount = (goal.currentAmount || 0) + Number(amount);

    await db.collection("goals").updateOne(
      { _id: new ObjectId(id) },
      { $set: { currentAmount: newCurrentAmount } }
    );

    return NextResponse.json({
      success: true,
      id,
      previousAmount: goal.currentAmount || 0,
      depositAmount: Number(amount),
      newCurrentAmount,
      targetAmount: goal.targetAmount,
      progress: Math.round((newCurrentAmount / goal.targetAmount) * 100)
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

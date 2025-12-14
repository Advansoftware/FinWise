// src/app/api/v1/budgets/route.ts
// Budgets API - CRUD for budgets

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";
import { ObjectId } from "mongodb";

// GET /api/v1/budgets - List user's budgets
export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const { db } = await connectToDatabase();
    const budgets = await db.collection("budgets")
      .find({ userId: user.id })
      .toArray();

    const formattedBudgets = budgets.map((b) => ({
      ...b,
      id: b._id.toString(),
      _id: undefined,
    }));

    return NextResponse.json(formattedBudgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/v1/budgets - Create a new budget
export async function POST(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const body = await request.json();
    const { name, category, amount, period } = body;

    if (!name || !category || !amount) {
      return NextResponse.json(
        { error: "Missing required fields (name, category, amount)" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const newBudget = {
      userId: user.id,
      name,
      category,
      amount: Number(amount),
      period: period || "monthly",
      currentSpending: 0,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("budgets").insertOne(newBudget);

    return NextResponse.json({
      ...newBudget,
      id: result.insertedId.toString(),
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

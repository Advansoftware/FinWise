// src/app/api/v1/goals/route.ts
// Goals API - CRUD for financial goals

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";

// GET /api/v1/goals - List user's goals
export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const { db } = await connectToDatabase();
    const goals = await db.collection("goals")
      .find({ userId: user.id })
      .toArray();

    const formattedGoals = goals.map((g) => ({
      ...g,
      id: g._id.toString(),
      _id: undefined,
    }));

    return NextResponse.json(formattedGoals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/v1/goals - Create a new goal
export async function POST(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const body = await request.json();
    const { name, targetAmount, currentAmount, monthlyDeposit, targetDate } = body;

    if (!name || !targetAmount) {
      return NextResponse.json(
        { error: "Missing required fields (name, targetAmount)" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const newGoal = {
      userId: user.id,
      name,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      monthlyDeposit: monthlyDeposit ? Number(monthlyDeposit) : undefined,
      targetDate: targetDate || undefined,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("goals").insertOne(newGoal);

    return NextResponse.json({
      ...newGoal,
      id: result.insertedId.toString(),
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

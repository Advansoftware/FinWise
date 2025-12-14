// src/app/api/v1/goals/[id]/route.ts
// Goal by ID - GET, PUT, DELETE

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";
import { ObjectId } from "mongodb";

// GET /api/v1/goals/[id] - Get single goal
export async function GET(
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
    const { db } = await connectToDatabase();
    const goal = await db.collection("goals").findOne({
      _id: new ObjectId(id),
      userId: user.id
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...goal,
      id: goal._id.toString(),
      _id: undefined
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// PUT /api/v1/goals/[id] - Update goal
export async function PUT(
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
    const { db } = await connectToDatabase();

    const existing = await db.collection("goals").findOne({
      _id: new ObjectId(id),
      userId: user.id
    });

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const updates: any = {};
    if (body.name) updates.name = body.name;
    if (body.targetAmount !== undefined) updates.targetAmount = Number(body.targetAmount);
    if (body.currentAmount !== undefined) updates.currentAmount = Number(body.currentAmount);
    if (body.monthlyDeposit !== undefined) updates.monthlyDeposit = Number(body.monthlyDeposit);
    if (body.targetDate) updates.targetDate = body.targetDate;

    await db.collection("goals").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    return NextResponse.json({ id, ...updates, success: true });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/v1/goals/[id] - Delete goal
export async function DELETE(
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
    const { db } = await connectToDatabase();

    const result = await db.collection("goals").deleteOne({
      _id: new ObjectId(id),
      userId: user.id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Goal deleted" });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// src/app/api/v1/installments/[id]/route.ts
// Installment by ID - GET, PUT, DELETE

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";
import { ObjectId } from "mongodb";

// GET /api/v1/installments/[id] - Get single installment
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
    const installment = await db.collection("installments").findOne({
      _id: new ObjectId(id),
      userId: user.id
    });

    if (!installment) {
      return NextResponse.json({ error: "Installment not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...installment,
      id: installment._id.toString(),
      _id: undefined
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// PUT /api/v1/installments/[id] - Update installment
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

    const existing = await db.collection("installments").findOne({
      _id: new ObjectId(id),
      userId: user.id
    });

    if (!existing) {
      return NextResponse.json({ error: "Installment not found" }, { status: 404 });
    }

    const updates: any = {};
    if (body.name) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category) updates.category = body.category;
    if (body.subcategory !== undefined) updates.subcategory = body.subcategory;
    if (body.installmentAmount !== undefined) updates.installmentAmount = Number(body.installmentAmount);
    if (body.isRecurring !== undefined) updates.isRecurring = body.isRecurring;

    await db.collection("installments").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    return NextResponse.json({ id, ...updates, success: true });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/v1/installments/[id] - Delete installment
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

    const result = await db.collection("installments").deleteOne({
      _id: new ObjectId(id),
      userId: user.id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Installment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Installment deleted" });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

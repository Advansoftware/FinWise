import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";
import { ObjectId } from "mongodb";

// GET /api/v1/wallets/[id] - Get single wallet
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
    const wallet = await db.collection("wallets").findOne({
      _id: new ObjectId(id),
      userId: user.id
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...wallet,
      id: wallet._id.toString(),
      _id: undefined
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// PUT /api/v1/wallets/[id] - Update wallet
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
    const { name, type, balance } = body; // Balance usually updated via transactions, but editing allowed here manually? 
    // Allowing manual edit for now as per CRUD req.

    const { db } = await connectToDatabase();

    // Ensure ownership
    const existing = await db.collection("wallets").findOne({ _id: new ObjectId(id), userId: user.id });
    if (!existing) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (type) updates.type = type;
    if (balance !== undefined) updates.balance = Number(balance);

    await db.collection("wallets").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    return NextResponse.json({ id, ...updates, success: true });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/v1/wallets/[id] - Delete wallet
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
    const result = await db.collection("wallets").deleteOne({
      _id: new ObjectId(id),
      userId: user.id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Optional: Delete related transactions?
    // For now, simple delete.

    return NextResponse.json({ success: true, message: "Wallet deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

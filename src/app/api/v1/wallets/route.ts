import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";
import { ObjectId } from "mongodb";

// GET /api/v1/wallets - List user's wallets
export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const { db } = await connectToDatabase();
    const wallets = await db.collection("wallets").find({ userId: user.id }).toArray();

    const formattedWallets = wallets.map((wallet) => ({
      ...wallet,
      id: wallet._id.toString(),
      _id: undefined,
    }));

    return NextResponse.json(formattedWallets);
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/v1/wallets - Create a new wallet
export async function POST(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const body = await request.json();
    const { name, type, balance } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const newWallet = {
      userId: user.id,
      name,
      type,
      balance: Number(balance) || 0,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("wallets").insertOne(newWallet);

    return NextResponse.json({
      ...newWallet,
      id: result.insertedId.toString(),
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating wallet:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/v1/wallets - Update a wallet (requires id in body or query param? REST says path... Next.js App Router uses dynamic routes [id]/route.ts). 
// Wait, for [id] I need a separate file.
// The user asked for full CRUD. I should structure it as:
// /api/v1/wallets/route.ts (GET, POST)
// /api/v1/wallets/[id]/route.ts (GET, PUT, DELETE)

// I will handle GET/POST here and creating [id]/route.ts for PUT/DELETE in next steps.

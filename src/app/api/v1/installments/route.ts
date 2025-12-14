// src/app/api/v1/installments/route.ts
// Installments API - CRUD for installments/recurring payments

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";

// GET /api/v1/installments - List user's installments
export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const { db } = await connectToDatabase();

    // Simple list by default
    const installments = await db.collection("installments")
      .find({ userId: user.id })
      .sort({ startDate: -1 })
      .toArray();

    const formattedInstallments = installments.map((i) => ({
      ...i,
      id: i._id.toString(),
      _id: undefined,
    })) as any[];

    // Calculate summary if requested
    if (action === "summary") {
      const now = new Date();
      const activeInstallments = formattedInstallments.filter(i => {
        const paidInstallments = i.payments?.length || 0;
        return paidInstallments < i.totalInstallments;
      });

      const totalMonthlyCommitment = activeInstallments.reduce((sum, i) => sum + (i.installmentAmount || 0), 0);

      return NextResponse.json({
        total: formattedInstallments.length,
        active: activeInstallments.length,
        totalMonthlyCommitment,
        installments: formattedInstallments
      });
    }

    return NextResponse.json(formattedInstallments);
  } catch (error) {
    console.error("Error fetching installments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/v1/installments - Create a new installment
export async function POST(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      subcategory,
      establishment,
      totalAmount,
      totalInstallments,
      installmentAmount,
      startDate,
      isRecurring,
      walletId
    } = body;

    if (!name || !totalInstallments || !installmentAmount || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields (name, totalInstallments, installmentAmount, startDate)" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const newInstallment = {
      userId: user.id,
      name,
      description: description || "",
      category: category || "Outros",
      subcategory: subcategory || "",
      establishment: establishment || "",
      totalAmount: totalAmount ? Number(totalAmount) : Number(installmentAmount) * Number(totalInstallments),
      totalInstallments: Number(totalInstallments),
      installmentAmount: Number(installmentAmount),
      startDate,
      isRecurring: isRecurring || false,
      walletId: walletId || null,
      payments: [],
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("installments").insertOne(newInstallment);

    return NextResponse.json({
      ...newInstallment,
      id: result.insertedId.toString(),
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating installment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

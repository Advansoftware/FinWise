// src/app/api/v1/installments/[id]/pay/route.ts
// Mark installment payment as paid

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";
import { ObjectId } from "mongodb";

// POST /api/v1/installments/[id]/pay - Mark an installment as paid
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
    const { installmentNumber, paidAmount, paidDate } = body;

    if (!installmentNumber) {
      return NextResponse.json(
        { error: "installmentNumber is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const installment = await db.collection("installments").findOne({
      _id: new ObjectId(id),
      userId: user.id
    });

    if (!installment) {
      return NextResponse.json({ error: "Installment not found" }, { status: 404 });
    }

    // Check if already paid
    const payments = installment.payments || [];
    const alreadyPaid = payments.some((p: any) => p.installmentNumber === installmentNumber);

    if (alreadyPaid) {
      return NextResponse.json({ error: "This installment is already paid" }, { status: 400 });
    }

    const newPayment = {
      installmentNumber: Number(installmentNumber),
      paidAmount: paidAmount ? Number(paidAmount) : installment.installmentAmount,
      paidDate: paidDate || new Date().toISOString(),
      status: "paid"
    };

    await db.collection("installments").updateOne(
      { _id: new ObjectId(id) },
      { $push: { payments: newPayment } as any }
    );

    return NextResponse.json({
      success: true,
      id,
      payment: newPayment,
      paidCount: payments.length + 1,
      totalInstallments: installment.totalInstallments,
      remaining: installment.totalInstallments - (payments.length + 1)
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// src/app/api/v1/receipts/scan-ai/route.ts
// AI-powered receipt image analysis

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";
import { extractReceiptInfoAction } from "@/services/ai-actions";

// POST /api/v1/receipts/scan-ai - Analyze receipt image with AI
export async function POST(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Image (base64) is required" },
        { status: 400 }
      );
    }

    // Validate base64 format
    const isValidBase64 = /^data:image\/(jpeg|jpg|png|webp);base64,/.test(image) ||
      /^[A-Za-z0-9+/=]+$/.test(image.substring(0, 100));

    if (!isValidBase64) {
      return NextResponse.json(
        { error: "Invalid image format. Use base64 encoded image." },
        { status: 400 }
      );
    }

    console.log(`[scan-ai] User ${authResult.user.id} analyzing receipt image`);

    // Use the existing AI action (costs 10 credits)
    const result = await extractReceiptInfoAction(
      { photoDataUri: image },
      authResult.user.id,
      undefined, // Use default provider
      false // Not a free action
    );

    if (!result.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not extract receipt data from image"
        },
        { status: 422 }
      );
    }

    // Format response to match mobile expectations
    return NextResponse.json({
      success: true,
      establishment: result.establishment || "",
      date: result.date || new Date().toISOString().split("T")[0],
      items: result.items.map(item => ({
        item: item.item,
        amount: item.amount,
        quantity: 1,
        category: result.suggestedCategory || "Supermercado"
      })),
      totalAmount: result.totalAmount || result.items.reduce((sum, i) => sum + i.amount, 0),
      suggestedCategory: result.suggestedCategory || "Supermercado"
    });

  } catch (error) {
    console.error("[scan-ai] Error:", error);

    // Check for credit-related errors
    if (error instanceof Error && error.message.includes("crédito")) {
      return NextResponse.json(
        { error: error.message },
        { status: 402 } // Payment Required
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

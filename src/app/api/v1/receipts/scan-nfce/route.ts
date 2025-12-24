// src/app/api/v1/receipts/scan-nfce/route.ts
// Scraping de NFCe via QR Code URL

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";
import { extractNFCeData } from "@/services/nfce-service";

// POST /api/v1/receipts/scan-nfce - Extract data from NFCe URL
export async function POST(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL pattern for NFCe
    const isValidNFCeUrl = /nfce|qrcode|sefaz|fazenda|portalsped/i.test(url);
    if (!isValidNFCeUrl) {
      return NextResponse.json(
        { error: "Invalid NFCe URL" },
        { status: 400 }
      );
    }

    console.log(`[scan-nfce] User ${authResult.user.id} scanning: ${url}`);

    // Extract data using the existing service
    const result = await extractNFCeData(url);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to extract NFCe data"
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      establishment: result.establishment,
      date: result.date,
      items: result.items,
      totalAmount: result.totalAmount,
      suggestedCategory: result.suggestedCategory
    });

  } catch (error) {
    console.error("[scan-nfce] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

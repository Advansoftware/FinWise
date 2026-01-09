// src/app/api/v1/credits/consume/route.ts
// API endpoint to consume AI credits - Used by RespondIA/WhatsApp integration

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";
import { ObjectId } from "mongodb";
import { AICreditLogAction } from "@/lib/types";

// Credit costs for different WhatsApp actions
const WHATSAPP_CREDIT_COSTS: Record<string, number> = {
  'WhatsApp - Mensagem com IA': 2,      // Simple message processing with AI
  'WhatsApp - Imagem/OCR': 10,           // Image processing/OCR
  'WhatsApp - Áudio Transcrito': 5,      // Audio transcription
  'WhatsApp - Categorização': 1,         // Auto categorization
  // Also support generic actions
  'Dica Rápida': 1,
  'Chat com Assistente': 2,
  'Sugestão de Categoria': 1,
  'Leitura de Nota Fiscal (OCR)': 10,
};

// Valid actions that can be consumed via API
const VALID_ACTIONS: AICreditLogAction[] = [
  'WhatsApp - Mensagem com IA',
  'WhatsApp - Imagem/OCR',
  'WhatsApp - Áudio Transcrito',
  'WhatsApp - Categorização',
  'Dica Rápida',
  'Chat com Assistente',
  'Sugestão de Categoria',
  'Leitura de Nota Fiscal (OCR)',
];

// POST /api/v1/credits/consume - Consume AI credits
export async function POST(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const body = await request.json();
    const { action, customCost, description } = body;

    // Validate action
    if (!action) {
      return NextResponse.json(
        { error: "Missing required field: action" },
        { status: 400 }
      );
    }

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        {
          error: "Invalid action",
          validActions: VALID_ACTIONS
        },
        { status: 400 }
      );
    }

    // Determine cost
    const cost = customCost ?? WHATSAPP_CREDIT_COSTS[action] ?? 2;

    if (cost <= 0) {
      return NextResponse.json(
        { error: "Invalid cost: must be positive" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get current user credits
    const userDoc = await db.collection("users").findOne({
      _id: new ObjectId(user.id)
    });

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentCredits = userDoc.aiCredits || 0;

    // Check if user has enough credits
    if (currentCredits < cost) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: cost,
          available: currentCredits,
          message: `Você precisa de ${cost} créditos, mas tem apenas ${currentCredits}.`
        },
        { status: 402 } // Payment Required
      );
    }

    // Deduct credits
    await db.collection("users").updateOne(
      { _id: new ObjectId(user.id) },
      { $inc: { aiCredits: -cost } }
    );

    // Log the credit usage (using same collection name as rest of app)
    await db.collection("aiCreditLogs").insertOne({
      userId: user.id,
      action,
      cost,
      timestamp: new Date().toISOString(),
    });

    // Get updated balance
    const newBalance = currentCredits - cost;

    return NextResponse.json({
      success: true,
      creditsConsumed: cost,
      action,
      previousBalance: currentCredits,
      newBalance,
      message: `${cost} crédito(s) consumido(s) para: ${action}`
    });

  } catch (error) {
    console.error("Error consuming credits:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/v1/credits/consume - Get credit costs info
export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  return NextResponse.json({
    costs: WHATSAPP_CREDIT_COSTS,
    validActions: VALID_ACTIONS,
    description: "Use POST to consume credits. Send 'action' in body, optionally 'customCost' to override default."
  });
}

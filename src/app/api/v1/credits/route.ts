// src/app/api/v1/credits/route.ts
// AI Credits API - Get credit balance and logs

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";
import { ObjectId } from "mongodb";

// GET /api/v1/credits - Get user's AI credit balance and logs
export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const { searchParams } = new URL(request.url);
    const includeLogs = searchParams.get("logs") === "true";

    const { db } = await connectToDatabase();

    // Get user's current credit balance
    const userDoc = await db.collection("users").findOne({
      _id: new ObjectId(user.id)
    });

    const result: any = {
      aiCredits: userDoc?.aiCredits || 0,
      plan: userDoc?.plan || "Básico"
    };

    if (includeLogs) {
      const logs = await db.collection("aiCreditLogs")
        .find({ userId: user.id })
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray();

      result.logs = logs.map(log => ({
        id: log._id.toString(),
        action: log.action,
        cost: log.cost,
        timestamp: log.timestamp,
      }));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching credits:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

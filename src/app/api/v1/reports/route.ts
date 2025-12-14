// src/app/api/v1/reports/route.ts
// Reports API - Get financial reports

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";

// GET /api/v1/reports - Get user's reports
export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "monthly" or "annual"
    const period = searchParams.get("period"); // e.g., "2024-12" or "2024"

    const { db } = await connectToDatabase();

    const query: any = { userId: user.id };
    if (type) query.type = type;
    if (period) query.period = period;

    const reports = await db.collection("reports")
      .find(query)
      .sort({ generatedAt: -1 })
      .limit(50)
      .toArray();

    const formattedReports = reports.map((r) => ({
      ...r,
      id: r._id.toString(),
      _id: undefined,
    }));

    return NextResponse.json(formattedReports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/v1/reports - Generate/save a new report
export async function POST(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const body = await request.json();
    const { type, period, data } = body;

    if (!type || !period || !data) {
      return NextResponse.json(
        { error: "Missing required fields (type, period, data)" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check for existing report
    const existing = await db.collection("reports").findOne({
      userId: user.id,
      period
    });

    if (existing) {
      // Update existing report
      await db.collection("reports").updateOne(
        { _id: existing._id },
        {
          $set: {
            data,
            type,
            generatedAt: new Date().toISOString()
          }
        }
      );

      return NextResponse.json({
        id: existing._id.toString(),
        updated: true,
        period,
        type
      });
    }

    const newReport = {
      userId: user.id,
      type,
      period,
      data,
      generatedAt: new Date().toISOString(),
    };

    const result = await db.collection("reports").insertOne(newReport);

    return NextResponse.json({
      ...newReport,
      id: result.insertedId.toString(),
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// src/app/api/v1/settings/route.ts
// User Settings API - Get and update user settings

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";

// GET /api/v1/settings - Get user's settings
export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const { db } = await connectToDatabase();

    const settings = await db.collection("settings").findOne({ userId: user.id });

    if (!settings) {
      // Return default settings
      return NextResponse.json({
        userId: user.id,
        categories: {},
        aiSettings: null,
        preferences: {}
      });
    }

    return NextResponse.json({
      ...settings,
      id: settings._id.toString(),
      _id: undefined
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/v1/settings - Update user's settings
export async function PUT(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const body = await request.json();
    const { db } = await connectToDatabase();

    // Build updates object, excluding sensitive fields
    const updates: any = {};

    // Allowed fields to update
    const allowedFields = [
      'categories',
      'preferences',
      'defaultWalletId',
      'currency',
      'locale',
      'notifications'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updates.updatedAt = new Date().toISOString();

    await db.collection("settings").updateOne(
      { userId: user.id },
      { $set: updates },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      updated: Object.keys(updates)
    });

  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

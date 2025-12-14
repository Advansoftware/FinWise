// src/app/api/v1/categories/route.ts
// Categories API - Get and manage user categories

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";

// GET /api/v1/categories - Get user's categories
export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const { db } = await connectToDatabase();

    const settings = await db.collection("settings").findOne({ userId: user.id });
    const userCategories = settings?.categories || {};

    // Merge with defaults
    const mergedCategories: Record<string, string[]> = { ...DEFAULT_CATEGORIES };
    Object.entries(userCategories).forEach(([category, subcategories]) => {
      if (mergedCategories[category]) {
        const existing = new Set(mergedCategories[category]);
        (subcategories as string[]).forEach(sub => existing.add(sub));
        mergedCategories[category] = Array.from(existing).sort();
      } else {
        mergedCategories[category] = subcategories as string[];
      }
    });

    return NextResponse.json({
      categories: mergedCategories,
      customCategories: userCategories
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/v1/categories - Add custom category/subcategory
export async function POST(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const body = await request.json();
    const { category, subcategory } = body;

    if (!category) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const settings = await db.collection("settings").findOne({ userId: user.id });
    const currentCategories = settings?.categories || {};

    if (!currentCategories[category]) {
      currentCategories[category] = [];
    }

    if (subcategory && !currentCategories[category].includes(subcategory)) {
      currentCategories[category].push(subcategory);
      currentCategories[category].sort();
    }

    await db.collection("settings").updateOne(
      { userId: user.id },
      { $set: { categories: currentCategories } },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      category,
      subcategory,
      subcategories: currentCategories[category]
    });

  } catch (error) {
    console.error("Error adding category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/v1/categories - Remove custom category/subcategory
export async function DELETE(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");

    if (!category) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const settings = await db.collection("settings").findOne({ userId: user.id });
    const currentCategories = settings?.categories || {};

    if (subcategory) {
      // Remove only subcategory
      if (currentCategories[category]) {
        currentCategories[category] = currentCategories[category].filter(
          (s: string) => s !== subcategory
        );
      }
    } else {
      // Remove entire category
      delete currentCategories[category];
    }

    await db.collection("settings").updateOne(
      { userId: user.id },
      { $set: { categories: currentCategories } }
    );

    return NextResponse.json({
      success: true,
      removed: subcategory ? { category, subcategory } : { category }
    });

  } catch (error) {
    console.error("Error removing category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

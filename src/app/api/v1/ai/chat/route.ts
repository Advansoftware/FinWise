import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedMobileUser } from "@/lib/api-auth";
import { getChatbotResponse } from "@/services/ai-actions";
import { ChatInput } from "@/ai/ai-types";

// POST /api/v1/ai/chat
export async function POST(request: NextRequest) {
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const user = authResult.user;

  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Fetch context data completely from DB (Backend-driven context)
    // 1. Transactions (last 50 for context)
    const transactions = await db.collection("transactions")
      .find({ userId: user.id })
      .sort({ date: -1 })
      .limit(50)
      .toArray();

    // 2. Monthly Reports (last 6 months)
    const monthlyReports = await db.collection("monthly_reports")
      .find({ userId: user.id })
      .sort({ year: -1, month: -1 })
      .limit(6)
      .toArray();

    // 3. Annual Reports (last 3 years)
    const annualReports = await db.collection("annual_reports")
      .find({ userId: user.id })
      .sort({ year: -1 })
      .limit(3)
      .toArray();

    const chatInput: ChatInput = {
      prompt: message,
      history: [], // TODO: Support history passed from mobile if needed
      transactions: transactions.map(t => ({
        ...t,
        id: t._id.toString(),
        _id: undefined
      })),
      monthlyReports: monthlyReports.map(r => ({
        ...r,
        id: r._id.toString(),
        _id: undefined
      })),
      annualReports: annualReports.map(r => ({
        ...r,
        id: r._id.toString(),
        _id: undefined
      })),
    };

    const response = await getChatbotResponse(chatInput, user.id);

    return NextResponse.json({ message: response });

  } catch (error) {
    console.error("Error in AI Chat:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

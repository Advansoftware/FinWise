import {NextRequest, NextResponse} from 'next/server';
import {connectToDatabase} from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const logs = await db
      .collection('ai_credit_logs')
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    // Convert MongoDB _id to id
    const formattedLogs = logs.map(log => ({
      id: log._id.toString(),
      userId: log.userId,
      action: log.action,
      creditsUsed: log.creditsUsed,
      timestamp: log.timestamp,
      isFreeAction: log.isFreeAction || false
    }));

    return NextResponse.json({ logs: formattedLogs });
  } catch (error) {
    console.error('Error fetching credit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

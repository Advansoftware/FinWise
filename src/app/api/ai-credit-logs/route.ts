import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/core/services/service-factory';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId é obrigatório' },
        { status: 400 }
      );
    }

    const db = await getDatabaseAdapter();
    const logs = await db.aiCreditLogs.findByUserId(userId);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching AI credit logs:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

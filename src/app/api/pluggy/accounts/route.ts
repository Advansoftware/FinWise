// src/app/api/pluggy/accounts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getPluggyService } from '@/services/pluggy';

/**
 * GET /api/pluggy/accounts
 * Fetch accounts for a connected item
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      );
    }

    const pluggyService = getPluggyService();
    const accounts = await pluggyService.listAccounts(itemId);

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error('Error listing Pluggy accounts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list accounts' },
      { status: 500 }
    );
  }
}

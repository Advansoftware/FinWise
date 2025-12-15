// src/app/api/pluggy/connect-token/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getPluggyService } from '@/services/pluggy';

/**
 * POST /api/pluggy/connect-token
 * Generate a Connect Token for Pluggy Connect widget
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const pluggyService = getPluggyService();

    const connectToken = await pluggyService.createConnectToken({
      options: {
        clientUserId: body.userId,
        webhookUrl: body.webhookUrl,
        updateItem: body.updateItem,
      },
      itemId: body.itemId,
    });

    return NextResponse.json({
      accessToken: connectToken,
    });
  } catch (error: any) {
    console.error('Error creating Pluggy connect token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create connect token' },
      { status: 500 }
    );
  }
}

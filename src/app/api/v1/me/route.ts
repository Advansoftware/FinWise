// src/app/api/mobile/me/route.ts
// Get Current User Endpoint - Returns authenticated user info

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedMobileUser } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { user, error } = await getAuthenticatedMobileUser(request);

  if (!user) {
    const status = error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      aiCredits: user.aiCredits,
    },
  });
}

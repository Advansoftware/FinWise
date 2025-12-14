// src/app/api/mobile/refresh/route.ts
// Token Refresh Endpoint - Returns new access token

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import {
  verifyRefreshToken,
  generateAccessToken,
  hasInfinityPlan,
  AuthenticatedUser,
} from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const userId = verifyRefreshToken(refreshToken);

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find user and verify the refresh token exists in their tokens list
    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
      'refreshTokens.token': refreshToken,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Refresh token has been revoked' },
        { status: 401 }
      );
    }

    // Build authenticated user object
    const authenticatedUser: AuthenticatedUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.displayName || user.name,
      plan: user.plan || 'Básico',
      aiCredits: user.aiCredits || 0,
    };

    // Re-verify Infinity plan (in case plan was downgraded)
    if (!hasInfinityPlan(authenticatedUser)) {
      // Remove refresh token since user no longer has access
      await usersCollection.updateOne(
        { _id: user._id },
        { $pull: { refreshTokens: { token: refreshToken } } as any }
      );

      return NextResponse.json(
        {
          error: 'Mobile API access requires Infinity plan',
          code: 'PLAN_REQUIRED',
        },
        { status: 403 }
      );
    }

    // Generate new access token
    const accessToken = generateAccessToken(authenticatedUser);

    return NextResponse.json({
      accessToken,
      user: {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        name: authenticatedUser.name,
        plan: authenticatedUser.plan,
        aiCredits: authenticatedUser.aiCredits,
      },
      expiresIn: 900, // 15 minutes in seconds
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

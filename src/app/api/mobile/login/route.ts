// src/app/api/mobile/login/route.ts
// Mobile Login Endpoint - Returns JWT tokens for Flutter app
// REQUIRES: Infinity plan

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import {
  generateAccessToken,
  generateRefreshToken,
  hasInfinityPlan,
  AuthenticatedUser,
} from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password (supports both bcrypt and legacy SHA256)
    let isPasswordValid = false;

    if (user.passwordHash?.startsWith('$2')) {
      // bcrypt hash
      isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    } else if (user.passwordHash) {
      // Legacy SHA256 hash
      const crypto = require('crypto');
      const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
      isPasswordValid = sha256Hash === user.passwordHash;

      // Migrate to bcrypt if login successful
      if (isPasswordValid) {
        const newHash = await bcrypt.hash(password, 10);
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { passwordHash: newHash } }
        );
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
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

    // Check if user has Infinity plan (required for mobile API)
    if (!hasInfinityPlan(authenticatedUser)) {
      return NextResponse.json(
        {
          error: 'Mobile API access requires Infinity plan',
          code: 'PLAN_REQUIRED',
          requiredPlan: 'Infinity',
          currentPlan: authenticatedUser.plan,
        },
        { status: 403 }
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(authenticatedUser);
    const refreshToken = generateRefreshToken(authenticatedUser.id);

    // Store refresh token in database for revocation support
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $push: {
          refreshTokens: {
            token: refreshToken,
            createdAt: new Date(),
            device: request.headers.get('User-Agent') || 'Unknown',
          },
        } as any,
      }
    );

    return NextResponse.json({
      accessToken,
      refreshToken,
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
    console.error('Mobile login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

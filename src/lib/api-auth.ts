// src/lib/api-auth.ts
// API Authentication Utility - Supports both Web (cookie) and Mobile (Bearer token)

import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { auth } from '@/lib/auth';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  plan?: string;
  aiCredits?: number;
}

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';

/**
 * Get authenticated user from request
 * Supports both:
 * 1. Cookie-based auth (NextAuth session) - for web
 * 2. Bearer token auth - for mobile apps
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  // Try cookie session first (web clients)
  try {
    const token = await getToken({
      req: request,
      secret: JWT_SECRET,
    });

    if (token?.id && token?.email) {
      return {
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        plan: token.plan as string,
        aiCredits: token.aiCredits as number,
      };
    }
  } catch (error) {
    // Cookie auth failed, try Bearer token
  }

  // Try Bearer token (mobile clients)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        name?: string;
        plan?: string;
        aiCredits?: number;
        type: 'access' | 'refresh';
      };

      // Only accept access tokens for API calls
      if (decoded.type === 'access') {
        return {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name,
          plan: decoded.plan,
          aiCredits: decoded.aiCredits,
        };
      }
    } catch (error) {
      // Token invalid or expired
      return null;
    }
  }

  return null;
}

/**
 * Check if user has Infinity plan (required for mobile API access)
 */
export function hasInfinityPlan(user: AuthenticatedUser): boolean {
  return user.plan?.toLowerCase() === 'infinity';
}

/**
 * Get authenticated user from request (mobile API - requires Infinity plan)
 * Returns user if authenticated AND has Infinity plan
 * Returns null if not authenticated or doesn't have Infinity plan
 */
export async function getAuthenticatedMobileUser(
  request: NextRequest
): Promise<{ user: AuthenticatedUser | null; error?: string }> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return { user: null, error: 'Unauthorized: Invalid or missing authentication' };
  }

  if (!hasInfinityPlan(user)) {
    return {
      user: null,
      error: 'Forbidden: Mobile API access requires Infinity plan'
    };
  }

  return { user };
}

/**
 * Generate JWT access token for mobile auth
 */
export function generateAccessToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      aiCredits: user.aiCredits,
      type: 'access',
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate JWT refresh token for mobile auth
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    {
      userId,
      type: 'refresh',
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Verify refresh token and return userId
 */
export function verifyRefreshToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      type: 'access' | 'refresh';
    };

    if (decoded.type === 'refresh') {
      return decoded.userId;
    }
  } catch (error) {
    // Token invalid or expired
  }
  return null;
}

/**
 * Helper to return 401 Unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

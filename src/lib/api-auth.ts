// src/lib/api-auth.ts
// API Authentication Utility - Supports both Web (cookie) and Mobile (Bearer token)

import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { auth } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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

// Configuração do App Oficial
const OFFICIAL_APP_CONFIG = {
  identifier: 'gastometria-mobile-official',
  secretKey: process.env.OFFICIAL_APP_SECRET || 'gastometria-app-secret-key-v1',
  protocolVersion: 1,
  enabled: process.env.ENABLE_OFFICIAL_APP_BYPASS === 'true',
};

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
 * Verifica se a requisição vem do app oficial Gastometria
 * O app oficial pode acessar a API sem precisar de plano Infinity
 */
export function isOfficialAppRequest(request: NextRequest): boolean {
  if (!OFFICIAL_APP_CONFIG.enabled) {
    return false;
  }

  try {
    const appToken = request.headers.get('X-App-Token');
    const platform = request.headers.get('X-App-Platform');
    const protocolVersion = request.headers.get('X-Security-Protocol');

    if (!appToken || !platform || !protocolVersion) {
      return false;
    }

    // Verifica versão do protocolo
    if (parseInt(protocolVersion) !== OFFICIAL_APP_CONFIG.protocolVersion) {
      return false;
    }

    // Decodifica e valida o token do app
    const decoded = Buffer.from(appToken, 'base64').toString('utf-8');
    const [payloadStr, signature] = decoded.split('|');

    if (!payloadStr || !signature) {
      return false;
    }

    // Verifica a assinatura HMAC
    const expectedSignature = crypto
      .createHmac('sha256', OFFICIAL_APP_CONFIG.secretKey)
      .update(payloadStr)
      .digest('hex');

    if (signature !== expectedSignature) {
      return false;
    }

    // Valida o payload
    const payload = JSON.parse(payloadStr);

    // Verifica identificador do app
    if (payload.app !== OFFICIAL_APP_CONFIG.identifier) {
      return false;
    }

    // Verifica timestamp (token válido por 5 minutos)
    const tokenAge = Date.now() - payload.ts;
    if (tokenAge > 5 * 60 * 1000) {
      return false;
    }

    // Verifica se a plataforma corresponde
    if (payload.platform !== platform.toLowerCase()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao validar token do app oficial:', error);
    return false;
  }
}

/**
 * Get authenticated user from request (mobile API - requires Infinity plan OR official app)
 * Returns user if authenticated AND (has Infinity plan OR is official app)
 * Returns null if not authenticated or doesn't have access
 */
export async function getAuthenticatedMobileUser(
  request: NextRequest
): Promise<{ user: AuthenticatedUser | null; error?: string; isOfficialApp?: boolean }> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return { user: null, error: 'Unauthorized: Invalid or missing authentication' };
  }

  // Verifica se é o app oficial (bypass do plano Infinity)
  const isOfficial = isOfficialAppRequest(request);
  if (isOfficial) {
    return { user, isOfficialApp: true };
  }

  // Se não é app oficial, precisa de plano Infinity
  if (!hasInfinityPlan(user)) {
    return {
      user: null,
      error: 'Forbidden: Mobile API access requires Infinity plan'
    };
  }

  return { user, isOfficialApp: false };
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

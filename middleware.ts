// middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Rotas públicas que não precisam de autenticação
const publicRoutes = [
  '/login',
  '/signup',
  '/reset-password',
  '/api/auth',
  '/api/stripe-webhook',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/sw.js',
  '/icons',
  '/blog',
  '/docs',
  '/',
];

// Rotas que devem redirecionar usuários autenticados
const authRoutes = ['/login', '/signup'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route =>
    pathname.startsWith(route) || pathname === route
  );

  // Verificar se é uma rota de autenticação (login/signup)
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Se está logado e tentando acessar login/signup, redirecionar para dashboard
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Se não está logado e tentando acessar rota protegida
  if (!isLoggedIn && !isPublicRoute) {
    const callbackUrl = pathname + (req.nextUrl.search || '');
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

// Configuração do matcher para otimizar performance
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",           // Landing page
  "/login",      // Login page
  "/signup",     // Signup page
  "/docs",       // Documentation (all /docs/* routes)
  "/privacy",    // Privacy policy
  "/terms",      // Terms of use
  "/api/auth",   // NextAuth API routes
  "/api/cron",   // Cron jobs
];

// Routes that should redirect to dashboard if user is already logged in
const AUTH_ROUTES = ["/login", "/signup"];

// Check if path matches any public route
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

// Check if path is an auth route (login/signup)
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") // Static files like .js, .css, .png, etc.
  ) {
    return NextResponse.next();
  }

  // Get the user's session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const isPublic = isPublicRoute(pathname);
  const isAuth = isAuthRoute(pathname);

  // If user is authenticated and tries to access auth routes (login/signup),
  // redirect to dashboard
  if (isAuthenticated && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is authenticated and tries to access landing page,
  // redirect to dashboard
  if (isAuthenticated && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If route is not public and user is not authenticated,
  // redirect to login
  if (!isPublic && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)",
  ],
};

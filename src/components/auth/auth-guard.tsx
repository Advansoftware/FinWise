// src/components/auth/auth-guard.tsx
"use client";

import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "../logo";

const PROTECTED_ROOT = "/dashboard";
const PUBLIC_ROOT = "/";
const LOGIN_ROOT = "/login";

export function AuthGuard({
  children,
  isProtected = false,
}: {
  children: React.ReactNode;
  isProtected?: boolean;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (loading) {
      return; // Still waiting for auth state to resolve.
    }

    const isAuthRoute =
      pathname.startsWith(LOGIN_ROOT) || pathname.startsWith("/signup");

    // User is not logged in
    if (!user) {
      if (isProtected) {
        // If on a protected route, redirect to login.
        router.replace(LOGIN_ROOT);
      } else {
        // On a public route without a user, stop checking and show the content.
        setIsChecking(false);
      }
      return;
    }

    // User is logged in
    if (user) {
      // If on an auth page (login/signup) or the landing page, redirect to the main dashboard.
      if (isAuthRoute || pathname === PUBLIC_ROOT) {
        router.replace(PROTECTED_ROOT);
      } else {
        // On any other page (protected or public docs), stop checking and show content.
        setIsChecking(false);
      }
    }
  }, [user, loading, isProtected, router]); // Removed pathname

  if (isChecking) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <Logo
          sx={{
            height: "3rem",
            width: "3rem",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        />
        <CircularProgress size={24} />
      </Box>
    );
  }

  return <>{children}</>;
}

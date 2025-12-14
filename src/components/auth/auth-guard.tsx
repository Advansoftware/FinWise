// src/components/auth/auth-guard.tsx
"use client";

import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "../logo";

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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // If not a protected route, show content immediately
    if (!isProtected) {
      setIsReady(true);
      return;
    }

    // For protected routes, wait for auth to resolve
    if (loading) {
      return;
    }

    // Auth resolved - check if user exists
    if (user) {
      // User is authenticated, show protected content
      setIsReady(true);
    } else {
      // No user on protected route - redirect to login
      // The middleware should handle this, but this is a fallback
      router.replace(LOGIN_ROOT);
    }
  }, [user, loading, isProtected, router]);

  // Show loading state for protected routes while checking auth
  if (isProtected && !isReady) {
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

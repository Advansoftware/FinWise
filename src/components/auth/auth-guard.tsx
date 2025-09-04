// src/components/auth/auth-guard.tsx
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Logo } from '../logo';

const PROTECTED_ROOT = '/dashboard';
const PUBLIC_ROOT = '/';
const LOGIN_ROOT = '/login';

export function AuthGuard({ children, isProtected = false }: { children: React.ReactNode, isProtected?: boolean }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (loading) {
      return; // Wait for the auth state to be resolved.
    }
    
    const isAuthRoute = pathname.startsWith(LOGIN_ROOT) || pathname.startsWith('/signup');
    const isDocsRoute = pathname.startsWith('/docs');

    if (isProtected) {
      // If a protected route is being accessed and there's no user, redirect to login.
      if (!user) {
        router.replace(LOGIN_ROOT);
        return; // Stop further execution
      }
    } else {
      // If a public route is being accessed by an authenticated user...
      if (user) {
        // ...and it's a landing or auth page, redirect to the dashboard.
        if (isAuthRoute || pathname === PUBLIC_ROOT) {
          router.replace(PROTECTED_ROOT);
          return; // Stop further execution
        }
      }
    }
   
    // If no redirection is needed, show the page content.
    setIsChecking(false);

  }, [user, loading, router, pathname, isProtected]);

  if (isChecking) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Logo className="h-12 w-12 animate-pulse" />
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

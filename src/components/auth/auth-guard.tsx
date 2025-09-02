
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Logo } from '../logo';

const PROTECTED_ROOT = '/dashboard';
const PUBLIC_ROOT = '/';
const LOGIN_ROOT = '/login';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (loading) {
      return; // Wait for the initial Firebase auth check to complete.
    }
    
    setIsChecking(true);

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isProtectedRoute = !isAuthRoute && pathname !== PUBLIC_ROOT;
    
    // If user is logged in
    if (user) {
        // and tries to access an auth route (login/signup), redirect to dashboard
        if (isAuthRoute) {
            router.replace(PROTECTED_ROOT);
            return;
        }
        // and tries to access the landing page, redirect to dashboard
        if (pathname === PUBLIC_ROOT) {
            router.replace(PROTECTED_ROOT);
            return;
        }
    } 
    // If user is NOT logged in
    else {
        // and tries to access a protected route, redirect to login
        if (isProtectedRoute) {
            router.replace(LOGIN_ROOT);
            return;
        }
    }

    // If none of the above, stop checking and show the page.
    setIsChecking(false);

  }, [user, loading, router, pathname]);

  if (isChecking || loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Logo className="h-12 w-12 animate-pulse" />
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

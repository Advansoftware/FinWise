
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Logo } from '../logo';

const PROTECTED_ROOT = '/dashboard';

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
    const isProtectedRoute = !isAuthRoute && pathname !== '/';

    // If on a protected route and not logged in, redirect to login.
    if (isProtectedRoute && !user) {
      router.replace('/login');
      return;
    }

    // If on an auth route and logged in, redirect to the dashboard.
    if (isAuthRoute && user) {
      router.replace(PROTECTED_ROOT);
      return;
    }

    // If everything is fine, stop checking and show the page.
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

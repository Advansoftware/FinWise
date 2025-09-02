
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Logo } from '../logo';

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
      return; // Aguarde a verificação inicial do Firebase terminar.
    }
    
    setIsChecking(true);

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');

    if (isProtected) {
      // Se a rota é protegida e não há usuário, redireciona para o login.
      if (!user) {
        router.replace('/login');
      } else {
        setIsChecking(false);
      }
    } else {
      // Se é uma rota de autenticação (não protegida) e há um usuário, redireciona para o dashboard.
      if (user && isAuthRoute) {
        router.replace('/dashboard');
      } else {
        setIsChecking(false);
      }
    }
  }, [user, loading, router, pathname, isProtected]);

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

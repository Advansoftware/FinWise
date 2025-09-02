
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
      return; // Wait for the initial Firebase auth check to complete.
    }
    
    setIsChecking(true);

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
    // A rota de documentação é sempre pública
    const isDocsRoute = pathname.startsWith('/docs');

    // Se o AuthGuard está em um layout protegido
    if (isProtected) {
      if (!user) {
        router.replace(LOGIN_ROOT);
        return;
      }
    } else { // Para layouts públicos (auth, docs, landing)
       if (user) {
          // Se o usuário logado tentar acessar login/signup ou a landing page, redireciona para o painel
          if (isAuthRoute || pathname === PUBLIC_ROOT) {
            router.replace(PROTECTED_ROOT);
            return;
          }
       }
    }
   
    // Se nenhuma das condições de redirecionamento for atendida, para de verificar e mostra a página.
    setIsChecking(false);

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

'use client';

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";

// Este componente não precisa mais do AuthProvider, pois ele está no layout raiz.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se o usuário estiver logado, redirecione-o para o dashboard.
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Enquanto carrega ou se o usuário já estiver logado, mostre um loader.
  if (loading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-12 w-12 text-primary" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  // Se não houver usuário logado e o carregamento estiver concluído, mostre a página de login/cadastro.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </main>
  );
}

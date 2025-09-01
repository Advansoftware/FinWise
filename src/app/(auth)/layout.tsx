
'use client';

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se a autenticação terminou e HÁ um usuário,
    // ele não pertence às páginas de login/cadastro, então redirecione.
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Enquanto carrega, ou se um usuário for encontrado, mostre um loader
  // para evitar um flash do formulário de autenticação.
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

  // Se o carregamento terminou e não há usuário, mostre o formulário de autenticação.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </main>
  );
}

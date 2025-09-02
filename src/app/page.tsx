
'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // A lógica de redirecionamento agora é centralizada no AuthGuard,
    // que redirecionará para /login ou /dashboard.
    // Esta página apenas redireciona para a raiz para acionar o AuthGuard.
    router.push('/dashboard'); 
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

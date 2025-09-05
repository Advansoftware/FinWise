// src/app/(docs)/layout.tsx

import { Logo } from "@/components/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-40 w-full border-b bg-background">
              <div className="container mx-auto flex h-14 items-center justify-between">
                  <Link href="/" className="flex items-center gap-2">
                    <Logo className="w-8 h-8"/>
                    <span className="text-xl font-bold">Gastometria</span>
                  </Link>
                  <Button asChild>
                      <Link href="/login">Acessar Painel</Link>
                  </Button>
              </div>
          </header>
          <main className="flex-1">{children}</main>
      </div>
    </AuthGuard>
  );
}

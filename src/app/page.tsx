
'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/use-auth";

export default function LandingPage() {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 md:p-6">
        <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Logo className="w-8 h-8"/>
                <span className="text-xl font-bold">FinWise</span>
            </div>
            <Button asChild variant="ghost">
                <Link href={user ? "/dashboard" : "/login"}>
                    {user ? "Acessar Painel" : "Entrar"}
                </Link>
            </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="container mx-auto max-w-3xl space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Suas finanças, finalmente sob controle.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
                O FinWise é o dashboard inteligente que te ajuda a visualizar seus gastos, criar orçamentos e alcançar seus objetivos financeiros com a ajuda de IA.
            </p>
            <div className="flex justify-center">
                <Button asChild size="lg">
                    <Link href={user ? "/dashboard" : "/login"}>
                        Comece Agora Gratuitamente
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </div>
        </div>
      </main>

       <footer className="p-4 md:p-6">
           <div className="container mx-auto text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} FinWise. Todos os direitos reservados.
           </div>
       </footer>
    </div>
  );
}

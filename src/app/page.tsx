
'use client';

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, ShieldCheck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const features = [
  {
    icon: Zap,
    name: "Dashboard Intuitivo",
    description: "Visualize suas finanças de forma clara e rápida.",
  },
  {
    icon: ShieldCheck,
    name: "Segurança de Ponta",
    description: "Seus dados financeiros protegidos com o melhor da tecnologia.",
  },
  {
    icon: CheckCircle,
    name: "Categorização Inteligente",
    description: "Organize suas despesas sem esforço com nossa IA.",
  },
];

const plans = [
    {
        name: "Básico",
        price: "Grátis",
        description: "Para quem está começando a organizar as finanças.",
        features: [
            "Até 50 transações mensais",
            "Dashboard principal",
            "Suporte por e-mail",
        ],
        cta: "Comece Agora",
        href: "/dashboard" // Changed from /signup
    },
    {
        name: "Pro",
        price: "R$19,90",
        price_period: "/mês",
        description: "Para controle total e insights avançados.",
        features: [
            "Transações ilimitadas",
            "Assistente com IA",
            "Importação de extratos",
            "Suporte prioritário",
        ],
        cta: "Seja Pro",
        href: "/dashboard", // Changed from /signup
        featured: true
    },
     {
        name: "Empresarial",
        price: "R$49,90",
        price_period: "/mês",
        description: "Para pequenas empresas e freelancers.",
        features: [
            "Tudo do plano Pro",
            "Múltiplos usuários",
            "Relatórios personalizados",
            "Integração com contabilidade",
        ],
        cta: "Fale Conosco",
        href: "/dashboard" // Changed from /signup
    }
]

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to the dashboard
    router.push('/dashboard');
  }, [router]);

  // Render a loading state or nothing while redirecting
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo className="h-12 w-12 text-primary" />
        <p>Carregando...</p>
      </div>
    </div>
  );
}

    
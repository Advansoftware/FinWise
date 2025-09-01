
'use client';

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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
        href: "/signup"
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
        href: "/signup",
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
        href: "/signup"
    }
]

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  if (loading || user) {
    return (
       <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-12 w-12 text-primary" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="text-xl font-bold">FinWise</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#features"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Funcionalidades
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Preços
          </Link>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 text-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                Controle suas finanças com{" "}
                <span className="text-primary">inteligência</span>.
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                O FinWise é o seu assistente financeiro pessoal, que te ajuda a
                tomar decisões mais inteligentes com seu dinheiro.
              </p>
              <div className="space-x-4">
                <Button asChild size="lg">
                  <Link href="/signup">Começar Gratuitamente</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                 <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
                  Funcionalidades Chave
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Tudo que você precisa para uma vida financeira saudável
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Desde a visualização de gastos até dicas personalizadas com Inteligência Artificial, o FinWise tem as ferramentas certas para você.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              {features.map((feature) => (
                 <div key={feature.name} className="flex flex-col items-center text-center p-4">
                    <feature.icon className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-bold">{feature.name}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                 </div>
              ))}
            </div>
          </div>
        </section>
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                <div className="space-y-3">
                     <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                        Planos flexíveis para cada necessidade
                    </h2>
                    <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Escolha o plano que melhor se adapta ao seu momento financeiro. Comece de graça.
                    </p>
                </div>
                <div className="mx-auto grid max-w-sm gap-8 sm:max-w-4xl sm:grid-cols-2 lg:max-w-5xl lg:grid-cols-3">
                   {plans.map((plan) => (
                     <div key={plan.name} className={`flex flex-col p-6 bg-card rounded-lg shadow-sm text-left ${plan.featured ? "border-2 border-primary" : "border"}`}>
                        <h3 className="text-2xl font-bold">{plan.name}</h3>
                        <p className="mt-2 text-muted-foreground">{plan.description}</p>
                        <div className="my-6">
                            <span className="text-4xl font-bold">{plan.price}</span>
                            {plan.price_period && <span className="ml-1 text-muted-foreground">{plan.price_period}</span>}
                        </div>
                        <ul className="space-y-2 flex-1">
                           {plan.features.map((feature) => (
                             <li key={feature} className="flex items-center">
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                {feature}
                            </li>
                           ))}
                        </ul>
                        <Button asChild className="mt-8 w-full">
                            <Link href={plan.href}>{plan.cta}</Link>
                        </Button>
                    </div>
                   ))}
                </div>
            </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} FinWise. Todos os direitos reservados.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Termos de Serviço
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Política de Privacidade
          </Link>
        </nav>
      </footer>
    </div>
  );
}


'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart, Bot, LayoutDashboard, Wallet, Check } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeInOut" }
};

const featureVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 }
};

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // O AuthGuard agora lida com o redirecionamento, mas mantemos um estado de carregamento
  // para evitar o flash da página de login antes que o AuthGuard decida.
  if (loading || user) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
         <div className="container mx-auto px-4 py-20 sm:py-32 flex flex-col items-center">
            <Skeleton className="h-16 w-3/4 mb-6" />
            <Skeleton className="h-8 w-1/2 mb-8" />
            <Skeleton className="h-12 w-48 mb-16" />
            <Skeleton className="h-[400px] w-full max-w-5xl" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      <header className="sticky top-0 z-50 p-4 md:p-6 bg-background/50 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto flex justify-between items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Link href="/" className="flex items-center gap-2">
                  <Logo className="w-8 h-8"/>
                  <span className="text-xl font-bold">FinWise</span>
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-4">
              <Button asChild variant="ghost">
                  <Link href="/docs">
                      Documentação
                  </Link>
              </Button>
              <Button asChild>
                  <Link href={user ? "/dashboard" : "/login"}>
                      {user ? "Acessar Painel" : "Entrar"}
                  </Link>
              </Button>
            </motion.div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto flex flex-col items-center text-center px-4 py-20 sm:py-32">
          <motion.h1 
            {...fadeIn}
            className="text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60"
          >
            Suas finanças, finalmente sob controle.
          </motion.h1>
          <motion.p 
            {...fadeIn}
            transition={{ ...fadeIn.transition, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            O FinWise é o dashboard inteligente que te ajuda a visualizar seus gastos, criar orçamentos e alcançar seus objetivos financeiros com a ajuda de IA.
          </motion.p>
          <motion.div 
            {...fadeIn}
            transition={{ ...fadeIn.transition, delay: 0.4 }}
            className="mt-8 flex justify-center"
          >
            <Button asChild size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
              <Link href={user ? "/dashboard" : "/login"}>
                Comece Agora Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
           <motion.div 
            {...fadeIn}
            transition={{...fadeIn.transition, delay: 0.6}}
            className="mt-16 w-full max-w-5xl"
           >
             <div className="relative rounded-xl shadow-2xl shadow-primary/10 border border-border/20 bg-card/50">
               <Image
                src="https://picsum.photos/1200/700"
                alt="Dashboard FinWise"
                width={1200}
                height={700}
                data-ai-hint="dashboard finance"
                className="rounded-lg opacity-80"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
             </div>
           </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-32 bg-card/20">
            <div className="container mx-auto px-4">
                <motion.div {...fadeIn}>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center">
                        Tudo que você precisa em um só lugar
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground text-center max-w-xl mx-auto">
                       De dashboards interativos a um assistente com IA, o FinWise tem as ferramentas para impulsionar sua saúde financeira.
                    </p>
                </motion.div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { icon: LayoutDashboard, title: "Dashboard Intuitivo", description: "Visualize suas finanças de forma clara com gráficos e relatórios interativos." },
                        { icon: Wallet, title: "Controle de Gastos", description: "Adicione e categorize suas transações para saber para onde seu dinheiro está indo." },
                        { icon: BarChart, title: "Análise Inteligente", description: "Receba insights e dicas personalizadas geradas por Inteligência Artificial." },
                        { icon: Bot, title: "Assistente Pessoal", description: "Converse com nossa IA para tirar dúvidas e analisar seus padrões de gastos." }
                    ].map((feature, index) => (
                        <motion.div 
                          key={feature.title}
                          variants={featureVariants}
                          initial="initial"
                          whileInView="animate"
                          viewport={{ once: true, amount: 0.5 }}
                          transition={{ ...featureVariants.transition, delay: index * 0.1 }}
                          className="flex flex-col items-center text-center p-6 rounded-lg bg-card/50 border border-border/20 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1"
                        >
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary">
                                <feature.icon className="h-6 w-6"/>
                            </div>
                            <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
                            <p className="mt-2 text-muted-foreground">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 sm:py-32">
            <div className="container mx-auto px-4">
                 <motion.div {...fadeIn}>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center">
                        Um plano para cada jornada financeira
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground text-center max-w-xl mx-auto">
                      Comece gratuitamente e evolua seu controle financeiro com recursos de IA avançados.
                    </p>
                </motion.div>

                <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {[
                        {
                            name: "Básico",
                            price: "Grátis",
                            description: "Para quem está começando a organizar as finanças.",
                            features: [
                                "Dashboard interativo",
                                "Transações ilimitadas",
                                "Gerenciamento de categorias",
                                "Análises com IA (10/mês)",
                            ],
                            cta: "Começar Agora",
                            variant: "outline"
                        },
                        {
                            name: "Pro",
                            price: "R$ 19,90",
                            priceDetail: "/mês",
                            description: "Para controle total e insights avançados com IA.",
                            features: [
                                "Tudo do plano Básico, e mais:",
                                "Análises e dicas com IA ilimitadas",
                                "Assistente de Chat com IA",
                                "Escanear notas fiscais (OCR)",
                                "Importação de extratos (CSV, OFX)",
                                "Suporte prioritário"
                            ],
                            cta: "Fazer Upgrade",
                            variant: "default",
                            highlight: true
                        },
                        {
                            name: "Plus",
                            price: "R$ 39,90",
                            priceDetail: "/mês",
                            description: "Para usuários avançados e planejamento futuro.",
                            features: [
                                "Tudo do plano Pro, e mais:",
                                "Orçamentos inteligentes com IA",
                                "Previsão de gastos futuros",
                                "Múltiplas carteiras/contas",
                                "Exportação avançada de relatórios",
                                "Acesso a novos recursos beta"
                            ],
                            cta: "Assinar o Plus",
                            variant: "outline"
                        }
                    ].map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            variants={featureVariants}
                            initial="initial"
                            whileInView="animate"
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ ...featureVariants.transition, delay: index * 0.15 }}
                            className={`flex flex-col rounded-lg border p-6 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${plan.highlight ? 'border-primary shadow-primary/20 shadow-lg' : 'border-border'}`}
                        >
                            {plan.highlight && <Badge className="w-fit mb-4 -mt-2">Mais Popular</Badge>}
                            <h3 className="text-2xl font-bold">{plan.name}</h3>
                            <p className="mt-2 text-muted-foreground">{plan.description}</p>
                            <div className="mt-6">
                                <span className="text-4xl font-extrabold">{plan.price}</span>
                                {plan.priceDetail && <span className="text-muted-foreground">{plan.priceDetail}</span>}
                            </div>
                            <ul className="mt-8 space-y-4 flex-1">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button asChild size="lg" className="w-full mt-8" variant={plan.variant as any}>
                                <Link href="/login">{plan.cta}</Link>
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

      </main>

       <footer className="p-4 md:p-6 border-t border-border/20">
           <div className="container mx-auto text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} FinWise. Todos os direitos reservados.
           </div>
       </footer>
    </div>
  );
}

    
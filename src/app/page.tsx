
'use client';

import React from 'react';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import { Button } from "@mui/material";
import { ArrowRight, BarChart, Bot, LayoutDashboard, Wallet, Check, Goal, FolderKanban, Upload, KeyRound, CheckCircle, XCircle, HelpCircle, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import Image from "next/image";
import { Chip } from "@mui/material";
import {Skeleton} from '@/components/mui-wrappers/skeleton';
import {AuthGuard} from '@/components/auth/auth-guard';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/mui-wrappers/table';
import {Card, CardContent, CardHeader, Typography} from '@mui/material';
import {cn} from '@/lib/utils';
import {structuredData, organizationData, websiteData, breadcrumbData, faqData} from '@/lib/structured-data';
import Head from 'next/head';

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

const featureComparison = {
    "Funcionalidades Principais": [
        { feature: "Dashboard interativo", Básico: true, Pro: true, Plus: true, Infinity: true },
        { feature: "Transações ilimitadas", Básico: true, Pro: true, Plus: true, Infinity: true },
        { feature: "Múltiplas carteiras e contas", Básico: true, Pro: true, Plus: true, Infinity: true },
        { feature: "Orçamentos manuais", Básico: true, Pro: true, Plus: true, Infinity: true },
        { feature: "Metas de economia", Básico: true, Pro: true, Plus: true, Infinity: true },
        { feature: "Ferramentas financeiras (Férias, 13º, Projeções)", Básico: true, Pro: true, Plus: true, Infinity: true },
    ],
    "Produtividade e IA": [
        { feature: "Gestão de Parcelamentos com gamificação", Básico: false, Pro: true, Plus: true, Infinity: true },
        { feature: "Importação de extratos (CSV/OFX)", Básico: false, Pro: true, Plus: true, Infinity: true },
        { feature: "Escanear notas fiscais (OCR)", Básico: false, Pro: true, Plus: true, Infinity: true },
        { feature: "Relatórios inteligentes com IA", Básico: false, Pro: true, Plus: true, Infinity: true },
        { feature: "Assistente de Chat com IA", Básico: false, Pro: true, Plus: true, Infinity: true },
        { feature: "Créditos de IA / mês", Básico: "Até 10", Pro: "100", Plus: "300", Infinity: "500" },
    ],
    "Automação e Análise Avançada": [
        { feature: "Orçamentos automáticos com IA", Básico: false, Pro: false, Plus: true, Infinity: true },
        { feature: "Previsão de saldos futuros", Básico: false, Pro: false, Plus: true, Infinity: true },
        { feature: "Projeção de metas com IA", Básico: false, Pro: false, Plus: true, Infinity: true },
        { feature: "Uso de IA Local (Ollama)", Básico: false, Pro: false, Plus: true, Infinity: true },
    ],
    "Controle Total": [
        { feature: "Uso de qualquer provedor (OpenAI, Google)", Básico: false, Pro: false, Plus: false, Infinity: true },
        { feature: "Credenciais de IA ilimitadas", Básico: false, Pro: false, Plus: false, Infinity: true },
        { feature: "Acesso a recursos beta", Básico: false, Pro: false, Plus: false, Infinity: true },
        { feature: "Suporte prioritário", Básico: false, Pro: false, Plus: false, Infinity: true },
    ],
};


export default function Page() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
         <div className="container mx-auto px-3 sm:px-4 py-12 sm:py-20 md:py-32 flex flex-col items-center">
            <Skeleton className="h-12 sm:h-16 w-full max-w-lg mb-4 sm:mb-6" />
            <Skeleton className="h-6 sm:h-8 w-3/4 max-w-md mb-6 sm:mb-8" />
            <Skeleton className="h-10 sm:h-12 w-full max-w-48 mb-8 sm:mb-16" />
            <Skeleton className="h-48 sm:h-64 md:h-[400px] w-full max-w-5xl rounded-lg" />
        </div>
      </div>
    )
  }
  
  return (
    <AuthGuard>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
        />
      </Head>
      <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
        <header className="sticky top-0 z-50 px-3 sm:px-4 md:px-6 h-14 sm:h-16 flex items-center justify-between bg-background/50 backdrop-blur-lg border-b border-border/50">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.5 }}
            >
              <Link href="/" className="flex items-center gap-2">
                  <Logo sx={{ width: { xs: '1.5rem', sm: '2rem' }, height: { xs: '1.5rem', sm: '2rem' } }} />
                  <span className="text-lg sm:text-xl font-bold">Gastometria</span>
              </Link>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.5, delay: 0.2 }} 
              className="flex items-center gap-2 sm:gap-4"
            >
              <Button asChild variant="text" size="small" className="hidden sm:inline-flex">
                  <Link href="/docs">
                      Documentação
                  </Link>
              </Button>
              <Button asChild size="small" className="text-xs sm:text-sm">
                  <Link href={user ? "/dashboard" : "/login"}>
                      {user ? "Painel" : "Entrar"}
                  </Link>
              </Button>
            </motion.div>
        </header>

        <main className="flex-1">
          {/* Hero Section */}
          <section className="container mx-auto flex flex-col items-center text-center px-3 sm:px-4 py-12 sm:py-20 md:py-32">
            <motion.h1 
              {...fadeIn}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60 leading-tight"
            >
              Sua vida financeira, sob seu controle.
            </motion.h1>
            <motion.p 
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.2 }}
              className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Gastometria une um design intuitivo com o poder da Inteligência Artificial para transformar a forma como você gerencia seu dinheiro.
            </motion.p>
            <motion.div 
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.4 }}
              className="mt-6 sm:mt-8 flex justify-center"
            >
              <Button asChild size="large" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow w-full sm:w-auto px-6 sm:px-8">
                <Link href={user ? "/dashboard" : "/login"} className="text-sm sm:text-base">
                  Comece Agora Gratuitamente
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
            </motion.div>
            <motion.div 
              {...fadeIn}
              transition={{...fadeIn.transition, delay: 0.6}}
              className="mt-8 sm:mt-12 md:mt-16 w-full max-w-5xl"
            >
              <div className="relative rounded-lg sm:rounded-xl shadow-2xl shadow-primary/10 border border-border/20 bg-card/50">
                <Image
                  src="https://picsum.photos/1200/700"
                  alt="Dashboard Gastometria"
                  width={1200}
                  height={700}
                  data-ai-hint="dashboard finance"
                  className="rounded-lg sm:rounded-xl opacity-80 w-full h-auto"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent rounded-lg sm:rounded-xl"></div>
              </div>
            </motion.div>
          </section>

          {/* Why Section */}
          <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-card/20 border-y border-border/20">
            <motion.div 
                {...fadeIn}
                viewport={{ once: true, amount: 0.5 }}
                className="container mx-auto px-3 sm:px-4 text-center"
            >
                <div className="inline-block rounded-full bg-primary/10 p-2 sm:p-3 text-primary mb-3 sm:mb-4">
                    <KeyRound className="h-6 w-6 sm:h-8 sm:w-8"/>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                    O Controle Financeiro é a Chave para a sua Liberdade
                </h2>
                <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                    Não se trata apenas de números e planilhas. Trata-se de trocar a ansiedade pela confiança. De saber exatamente para onde seu dinheiro vai, você ganha o poder de direcioná-lo para o que realmente importa: suas metas, seus sonhos e sua tranquilidade. O Gastometria foi criado para ser essa chave.
                </p>
            </motion.div>
          </section>


          {/* Features Section */}
          <section className="py-12 sm:py-16 md:py-20 lg:py-32">
              <div className="container mx-auto px-3 sm:px-4">
                  <motion.div {...fadeIn}>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-center leading-tight">
                          Ferramentas poderosas para sua vida financeira
                      </h2>
                      <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
                        Cada recurso do Gastometria foi projetado para te dar clareza e controle. Deixe de adivinhar e comece a tomar decisões financeiras com confiança.
                      </p>
                  </motion.div>

                  <div className="mt-8 sm:mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                      {[
                          { 
                            icon: LayoutDashboard, 
                            title: "Dashboard Centralizado", 
                            description: "Tenha uma visão completa de suas finanças em um só lugar. Acompanhe seu patrimônio líquido, receitas, despesas e transações recentes sem esforço."
                          },
                          { 
                            icon: FolderKanban, 
                            title: "Gestão de Parcelamentos", 
                            description: "Controle total de compras parceladas com gamificação. Acompanhe parcelas pagas, pendentes, ganhe pontos e badges por manter os pagamentos em dia!"
                          },
                          { 
                            icon: Wallet, 
                            title: "Orçamentos Inteligentes", 
                            description: "Defina limites de gastos para categorias e evite surpresas. Nossa IA pode até sugerir orçamentos com base nos seus hábitos para te ajudar a economizar." 
                          },
                          { 
                            icon: Goal, 
                            title: "Metas de Economia", 
                            description: "Transforme sonhos em planos. Crie metas, acompanhe seu progresso e veja a IA projetar quando você alcançará seus objetivos. Comemoramos com você a cada meta atingida!" 
                          },
                          { 
                            icon: Bot, 
                            title: "Assistente com IA", 
                            description: "Converse com nosso assistente para obter insights valiosos. Pergunte sobre seus gastos, peça análises e receba dicas personalizadas para otimizar suas finanças." 
                          },
                          { 
                            icon: Upload, 
                            title: "Importação e OCR", 
                            description: "Economize tempo importando extratos do seu banco (CSV/OFX). Tire uma foto de uma nota fiscal e deixe nossa IA extrair e categorizar os itens para você." 
                          },
                          { 
                            icon: BarChart, 
                            title: "Relatórios Detalhados", 
                            description: "Gere relatórios mensais e anuais com análises automáticas da IA. Entenda seus padrões de consumo e meça sua evolução financeira ao longo do tempo."
                          }
                      ].map((feature, index) => (
                          <motion.div 
                            key={feature.title}
                            variants={featureVariants}
                            initial="initial"
                            whileInView="animate"
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ ...featureVariants.transition, delay: index * 0.1 }}
                            className="flex flex-col items-start text-left p-4 sm:p-6 rounded-lg bg-card/50 border border-border/20 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1"
                          >
                              <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 text-primary">
                                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6"/>
                              </div>
                              <h3 className="mt-3 sm:mt-4 text-lg sm:text-xl font-semibold leading-tight">{feature.title}</h3>
                              <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                          </motion.div>
                      ))}
                  </div>
              </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing" className="py-12 sm:py-16 md:py-20 lg:py-32 bg-card/20 border-y border-border/20">
              <div className="container mx-auto px-3 sm:px-4">
                  <motion.div {...fadeIn}>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-center leading-tight">
                          Um plano para cada jornada financeira
                      </h2>
                      <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground text-center max-w-xl mx-auto leading-relaxed">
                        Comece gratuitamente com todas as ferramentas essenciais e evolua seu controle com o poder da IA.
                      </p>
                  </motion.div>

                  <div className="mt-8 sm:mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 items-start">
                      {[
                          {
                              name: "Básico",
                              price: "Grátis",
                              priceDetail: " para sempre",
                              description: "Controle financeiro manual completo.",
                              features: [
                                  "Dashboard interativo",
                                  "Transações e contas ilimitadas",
                                  "Orçamentos manuais",
                                  "Metas de economia",
                                  "**Ferramentas financeiras** (Férias, 13º, Projeções)",
                                  "Uso limitado da Gastometria AI",
                              ],
                              cta: "Começar Agora",
                              variant: "outline"
                          },
                          {
                              name: "Pro",
                              price: "R$ 19,90",
                              priceDetail: "/mês",
                              description: "Eficiência e insights para otimizar seu tempo.",
                              features: [
                                  "Tudo do plano Básico",
                                  "**100 Créditos de IA** /mês",
                                  "Assistente de Chat com IA",
                                  "Relatórios inteligentes",
                                  "Escanear notas fiscais (OCR)",
                                  "Importação de extratos",
                              ],
                              cta: "Fazer Upgrade",
                              variant: "info",
                              highlight: true
                          },
                          {
                              name: "Plus",
                              price: "R$ 39,90",
                              priceDetail: "/mês",
                              description: "Automação e flexibilidade com IA local.",
                              features: [
                                  "Tudo do plano Pro",
                                  "**300 Créditos de IA** /mês",
                                  "**Uso de IA Local (Ollama) ilimitado**",
                                  "Orçamentos automáticos",
                                  "Previsão de saldos futuros",
                                  "Projeção de metas com IA",
                              ],
                              cta: "Assinar o Plus",
                              variant: "outline"
                          },
                           {
                              name: "Infinity",
                              price: "R$ 59,90",
                              priceDetail: "/mês",
                              description: "Controle total e ilimitado para entusiastas de IA.",
                              features: [
                                  "Tudo do plano Plus",
                                  "**500 Créditos de IA** /mês",
                                  "**Uso de qualquer provedor de IA**",
                                  "Credenciais de IA ilimitadas",
                                  "Acesso a recursos beta",
                                  "Suporte prioritário",
                              ],
                              cta: "Seja Infinity",
                              variant: "outline"
                          }
                      ].map((plan, index) => (
                          <motion.div
                              key={plan.name}
                              variants={featureVariants}
                              initial="initial"
                              whileInView="animate"
                              viewport={{ once: true, amount: 0.3 }}
                              transition={{ ...featureVariants.transition, delay: index * 0.1 }}
                              className={`flex flex-col rounded-lg border p-4 sm:p-6 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${plan.highlight ? 'border-primary shadow-primary/20 shadow-lg' : 'border-border bg-card/30'}`}
                          >
                              {plan.highlight && <Chip className="w-fit mb-3 sm:mb-4 -mt-1 sm:-mt-2 text-xs">Mais Popular</Chip>}
                              <h3 className="text-xl sm:text-2xl font-bold">{plan.name}</h3>
                              <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">{plan.description}</p>
                              <div className="mt-4 sm:mt-6">
                                  <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">{plan.price}</span>
                                  {plan.priceDetail && <span className="text-sm sm:text-base text-muted-foreground">{plan.priceDetail}</span>}
                              </div>
                              <ul className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 flex-1">
                                  {plan.features.map(feature => (
                                      <li key={feature} className="flex items-start gap-2 sm:gap-3">
                                          <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 shrink-0" />
                                          <span dangerouslySetInnerHTML={{ __html: feature.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground/90">$1</strong>') }} className="text-sm sm:text-base text-muted-foreground leading-relaxed"></span>
                                      </li>
                                  ))}
                              </ul>
                              <Button asChild size="large" className="w-full mt-6 sm:mt-8 text-sm sm:text-base" variant={plan.variant as any}>
                                  <Link href="/login">{plan.cta}</Link>
                              </Button>
                          </motion.div>
                      ))}
                  </div>
              </div>
          </section>

           {/* Feature Comparison Section */}
          <section className="py-12 sm:py-16 md:py-20 lg:py-32">
            <div className="container mx-auto px-3 sm:px-4">
              <motion.div {...fadeIn}>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-center leading-tight">
                  Compare os Planos em Detalhes
                </h2>
                <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
                  Encontre o conjunto de ferramentas perfeito para sua necessidade, desde o controle essencial até a automação completa com IA.
                </p>
              </motion.div>

              {/* Desktop Table */}
              <motion.div
                variants={featureVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, amount: 0.2 }}
                className="mt-8 sm:mt-12 md:mt-16 hidden lg:block overflow-x-auto"
              >
                <Table className="[&_td]:text-center [&_th]:text-center">
                  <TableHeader>
                    <TableRow className="[&_th]:text-sm lg:[&_th]:text-base">
                      <TableHead className="text-left w-1/3">Funcionalidade</TableHead>
                      <TableHead>Básico</TableHead>
                      <TableHead className="text-primary">Pro</TableHead>
                      <TableHead>Plus</TableHead>
                      <TableHead>Infinity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(featureComparison).map(([category, features]) => (
                      <React.Fragment key={category}>
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={5} className="text-left font-bold text-sm lg:text-base py-3">
                            {category}
                          </TableCell>
                        </TableRow>
                        {features.map((item) => (
                          <TableRow key={item.feature}>
                            <TableCell className="text-left text-muted-foreground text-sm lg:text-base">{item.feature}</TableCell>
                            {['Básico', 'Pro', 'Plus', 'Infinity'].map((plan) => {
                              const value = item[plan as keyof typeof item];
                              return (
                                <TableCell key={plan}>
                                  {typeof value === 'boolean' ? (
                                    value ? <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-green-500 mx-auto" /> : <XCircle className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground/50 mx-auto" />
                                  ) : (
                                    <span className="font-semibold text-sm lg:text-base">{value}</span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>

              {/* Mobile Cards */}
              <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-4 sm:gap-6 lg:hidden">
                {['Básico', 'Pro', 'Plus', 'Infinity'].map((plan, index) => (
                    <motion.div 
                      key={plan}
                      variants={featureVariants}
                      initial="initial"
                      whileInView="animate"
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ ...featureVariants.transition, delay: index * 0.1 }}
                    >
                      <Card className={cn(plan === 'Pro' && 'border-primary')}>
                        <CardHeader className="pb-3 sm:pb-4">
                            <Typography variant="h6" className={cn("text-lg sm:text-xl", plan === 'Pro' && 'text-primary')}>{plan}</Typography>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4">
                            {Object.entries(featureComparison).map(([category, features]) => (
                               <div key={category}>
                                   <h4 className="font-semibold text-sm sm:text-base mb-2">{category}</h4>
                                   <ul className="space-y-2">
                                       {features.map(item => {
                                           const value = item[plan as keyof typeof item];
                                           if (value === false) return null;
                                           return (
                                               <li key={item.feature} className="flex items-start gap-2 sm:gap-3">
                                                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 shrink-0" />
                                                    <span className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                                        {item.feature}
                                                        {typeof value !== 'boolean' && <strong className="ml-1 text-foreground/90">({value})</strong>}
                                                    </span>
                                               </li>
                                           )
                                       })}
                                   </ul>
                               </div>
                            ))}
                        </CardContent>
                      </Card>
                    </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Preview Section */}
          <section className="py-12 sm:py-16 md:py-20 lg:py-32 bg-card/20 border-y border-border/20">
            <div className="container mx-auto px-3 sm:px-4">
              <motion.div {...fadeIn}>
                <div className="text-center mb-8 sm:mb-12">
                  <div className="inline-block rounded-full bg-primary/10 p-2 sm:p-3 text-primary mb-3 sm:mb-4">
                    <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8"/>
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                    Dúvidas Frequentes
                  </h2>
                  <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Respostas para as perguntas mais comuns sobre o Gastometria
                  </p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
                {[
                  {
                    question: "O Gastometria é gratuito?",
                    answer: "Sim! Oferecemos um plano Básico gratuito com funcionalidades essenciais. Para recursos avançados com IA, temos planos a partir de R$ 19,90/mês."
                  },
                  {
                    question: "Como funciona a inteligência artificial?",
                    answer: "Nossa IA analisa seus padrões de gastos para gerar relatórios automáticos, sugerir orçamentos personalizados e fornecer insights através do assistente de chat."
                  },
                  {
                    question: "Meus dados estão seguros?",
                    answer: "Absolutamente! Utilizamos criptografia de ponta e seguimos as melhores práticas de segurança. Não compartilhamos suas informações com terceiros."
                  },
                  {
                    question: "Posso importar dados do meu banco?",
                    answer: "Sim! Suportamos importação de extratos bancários nos formatos CSV e OFX, além de OCR para digitalizar notas fiscais nos planos pagos."
                  }
                ].map((faq, index) => (
                  <motion.div
                    key={index}
                    variants={featureVariants}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ ...featureVariants.transition, delay: index * 0.1 }}
                    className="p-4 sm:p-6 rounded-lg bg-card/50 border border-border/20 transition-all duration-300 hover:border-primary/50"
                  >
                    <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3 leading-tight">{faq.question}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div 
                {...fadeIn}
                transition={{ ...fadeIn.transition, delay: 0.6 }}
                className="text-center mt-8 sm:mt-12"
              >
                <Button asChild variant="outlined" size="large">
                  <Link href="/faq" className="text-sm sm:text-base">
                    Ver Todas as Perguntas
                    <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </section>

          {/* Blog Preview Section */}
          <section className="py-12 sm:py-16 md:py-20 lg:py-32">
            <div className="container mx-auto px-3 sm:px-4">
              <motion.div {...fadeIn}>
                <div className="text-center mb-8 sm:mb-12">
                  <div className="inline-block rounded-full bg-primary/10 p-2 sm:p-3 text-primary mb-3 sm:mb-4">
                    <BookOpen className="h-6 w-6 sm:h-8 sm:w-8"/>
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                    Educação Financeira
                  </h2>
                  <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Artigos e dicas para melhorar sua relação com o dinheiro
                  </p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
                {[
                  {
                    title: "10 Dicas Essenciais para Controlar seus Gastos em 2025",
                    description: "Estratégias práticas para manter suas finanças organizadas e alcançar seus objetivos.",
                    category: "Educação Financeira",
                    readTime: 8,
                    slug: "controlar-gastos-2025"
                  },
                  {
                    title: "Como a IA Pode Revolucionar suas Finanças",
                    description: "Entenda como a inteligência artificial pode ajudar no controle financeiro e análise de gastos.",
                    category: "Tecnologia",
                    readTime: 12,
                    slug: "ia-revoluciona-financas"
                  },
                  {
                    title: "Orçamento 50/30/20: O Método que Funciona",
                    description: "Aprenda a aplicar a regra 50/30/20 na prática e organize suas finanças de forma simples.",
                    category: "Planejamento",
                    readTime: 6,
                    slug: "orcamento-50-30-20"
                  }
                ].map((post, index) => (
                  <motion.div
                    key={index}
                    variants={featureVariants}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ ...featureVariants.transition, delay: index * 0.1 }}
                    className="group"
                  >
                    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <Chip variant="outlined" className="text-xs">
                            {post.category}
                          </Chip>
                          <span className="text-xs text-muted-foreground">
                            {post.readTime} min
                          </span>
                        </div>
                        <Typography variant="h6" className="text-base sm:text-lg leading-tight group-hover:text-primary transition-colors">
                          {post.title}
                        </Typography>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                          {post.description}
                        </p>
                        <Button asChild variant="text" size="small" className="p-0 h-auto text-xs sm:text-sm">
                          <Link href={`/blog/${post.slug}`} className="flex items-center">
                            Ler artigo
                            <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <motion.div 
                {...fadeIn}
                transition={{ ...fadeIn.transition, delay: 0.6 }}
                className="text-center mt-8 sm:mt-12"
              >
                <Button asChild variant="outlined" size="large">
                  <Link href="/blog" className="text-sm sm:text-base">
                    Ver Todos os Artigos
                    <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </section>

        </main>

        <footer className="p-3 sm:p-4 md:p-6 border-t border-border/20">
            <div className="container mx-auto text-center text-xs sm:text-sm text-muted-foreground">
                  © {new Date().getFullYear()} Gastometria. Todos os direitos reservados.
            </div>
        </footer>
      </div>
    </AuthGuard>
  );
}

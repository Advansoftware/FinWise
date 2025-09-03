// src/app/(app)/billing/page.tsx
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, Gem } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePlan } from "@/hooks/use-plan";
import { UserPlan } from "@/lib/types";
import { createStripeCheckoutAction, createStripePortalSession } from '@/app/actions';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { UpgradeCelebration } from '@/components/billing/upgrade-celebration';

const plans = [
    {
        name: "Básico",
        price: "Grátis",
        description: "Controle financeiro manual completo para quem está começando.",
        features: [
            "Dashboard interativo",
            "Transações ilimitadas",
            "Múltiplas carteiras e contas",
            "Orçamentos manuais por categoria",
            "Metas de economia",
            "Gerenciamento de categorias",
        ],
        cta: "Plano Atual",
    },
    {
        name: "Pro",
        price: "R$ 19,90/mês",
        description: "Eficiência e insights para otimizar seu tempo e dinheiro.",
        features: [
            "Tudo do plano Básico, e mais:",
            "**100 Créditos de IA** por mês",
            "Assistente de Chat com IA",
            "Relatórios inteligentes (Mensal/Anual)",
            "Escanear notas fiscais (OCR)",
            "Importação de extratos (CSV, OFX)",
            "Suporte prioritário",
        ],
        cta: "Fazer Upgrade",
    },
    {
        name: "Plus",
        price: "R$ 39,90/mês",
        description: "O piloto automático para sua vida financeira com IA preditiva.",
        features: [
            "Tudo do plano Pro, e mais:",
            "**300 Créditos de IA** por mês",
            "Orçamentos inteligentes e automáticos",
            "Previsão de gastos e saldos futuros",
            "Conciliação automática de transações",
            "Projeção de alcance de metas",
            "Acesso a novos recursos beta",
        ],
        cta: "Fazer Upgrade",
    }
]

function BillingPageContent() {
    const { plan: currentUserPlan, isLoading: isPlanLoading } = usePlan();
    const { user } = useAuth();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('success')) {
            setShowCelebration(true);
        }
    }, [searchParams]);

    const handleUpgrade = async (newPlan: Exclude<UserPlan, 'Básico'>) => {
        if (!user || !user.email) return;
        setIsProcessing(true);
        try {
            const result = await createStripeCheckoutAction(user.uid, user.email, newPlan);
            if (result.url) {
                window.location.href = result.url;
            } else {
                throw new Error(result.error || "Não foi possível iniciar o checkout.");
            }
        } catch (error) {
            console.error("Stripe checkout error:", error);
            toast({ 
                variant: 'destructive', 
                title: 'Erro no Checkout',
                description: 'Não foi possível redirecionar para a página de pagamento. Tente novamente mais tarde.'
            });
        } finally {
            setIsProcessing(false);
        }
    }
    
    const handleManageSubscription = async () => {
        if (!user) return;
        setIsProcessing(true);
        try {
            const { url, error } = await createStripePortalSession(user.uid);
            if (url) {
                window.location.href = url;
            } else {
                throw new Error(error || "Não foi possível abrir o portal de gerenciamento.");
            }
        } catch (error) {
            console.error("Stripe portal error:", error);
            toast({ 
                variant: 'destructive', 
                title: 'Erro',
                description: 'Não foi possível abrir o portal de gerenciamento. Tente novamente mais tarde.'
            });
        } finally {
            setIsProcessing(false);
        }
    }

    const isPaidPlan = currentUserPlan !== 'Básico';

    return (
        <div className="flex flex-col gap-6">
            {showCelebration && <UpgradeCelebration onComplete={() => setShowCelebration(false)} />}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">Assinatura e Créditos</h1>
                    <p className="text-muted-foreground">Gerencie seu plano e seu uso de créditos de IA.</p>
                </div>
                 {isPaidPlan && (
                    <Button onClick={handleManageSubscription} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="animate-spin mr-2"/> : <Gem className="mr-2 h-4 w-4" />}
                        Gerenciar Assinatura
                    </Button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {plans.map(plan => {
                    const isCurrent = plan.name === currentUserPlan;
                    
                    return (
                     <Card 
                        key={plan.name} 
                        className={`flex flex-col ${isCurrent ? 'border-primary shadow-lg' : ''}`}
                     >
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>{plan.name}</CardTitle>
                                {isCurrent && <Badge variant="secondary">Plano Atual</Badge>}
                                {plan.name === 'Pro' && <Badge>Mais Popular</Badge>}
                            </div>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                             <div className="text-3xl font-bold">{plan.price}</div>
                             <ul className="space-y-2">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                        <span dangerouslySetInnerHTML={{ __html: feature.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground/90">$1</strong>') }} className="text-muted-foreground"></span>
                                    </li>
                                ))}
                             </ul>
                        </CardContent>
                        <CardFooter>
                            {plan.name === 'Básico' ? (
                                <Button className="w-full" disabled={true} variant="outline">
                                    Seu Plano Atual
                                </Button>
                            ) : (
                                <Button 
                                    className="w-full" 
                                    disabled={isProcessing || isPlanLoading || isPaidPlan} 
                                    onClick={() => handleUpgrade(plan.name as Exclude<UserPlan, 'Básico'>)} 
                                    variant={isCurrent ? 'outline' : 'default'}
                                >
                                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isCurrent ? "Seu Plano Atual" : plan.cta}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                )})}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Como funcionam os Créditos de IA?</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-2">
                    <p>Os créditos de IA são a moeda que você usa para acessar funcionalidades inteligentes. Cada ação tem um custo diferente, dependendo de sua complexidade.</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><span className="font-semibold text-foreground">Ações Simples (1-2 créditos):</span> Gerar dicas, responder no chat, sugerir um orçamento.</li>
                        <li><span className="font-semibold text-foreground">Ações Complexas (5 créditos):</span> Gerar um relatório mensal, analisar um grupo de transações.</li>
                        <li><span className="font-semibold text-foreground">Ações de Imagem (10 créditos):</span> Escanear uma nota fiscal (OCR).</li>
                    </ul>
                    <p className="pt-2">Seus créditos são renovados mensalmente de acordo com seu plano. Em breve, você poderá comprar pacotes de créditos adicionais se precisar.</p>
                </CardContent>
            </Card>
        </div>
    )
}

export default function BillingPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <BillingPageContent />
        </Suspense>
    );
}
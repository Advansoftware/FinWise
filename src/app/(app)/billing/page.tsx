// src/app/(app)/billing/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePlan } from "@/hooks/use-plan";
import { UserPlan } from "@/lib/types";
import { createStripeCheckoutAction } from '@/app/actions';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { UpgradeCelebration } from '@/components/billing/upgrade-celebration';
import { useSearchParams } from 'next/navigation';

const plans: {name: UserPlan, price: string, description: string, features: string[], cta: string, priceId?: string}[] = [
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


export default function BillingPage() {
    const { plan: currentUserPlan, isLoading: isPlanLoading } = usePlan();
    const { user } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [updatingPlan, setUpdatingPlan] = useState<UserPlan | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);

    useEffect(() => {
        if (searchParams.get('success')) {
            toast({
                title: "Pagamento bem-sucedido!",
                description: "Obrigado por assinar! Seu plano foi atualizado.",
            });
            setShowCelebration(true);
        }

        if (searchParams.get('canceled')) {
            toast({
                variant: 'destructive',
                title: "Pagamento cancelado",
                description: "Você não foi cobrado. Continue explorando nossos recursos quando quiser.",
            });
        }
    }, [searchParams, toast]);

    const handlePlanChange = async (newPlan: UserPlan) => {
        if (!user || newPlan === 'Básico' || !user.email) {
            toast({
                variant: 'destructive',
                title: 'Erro de Autenticação',
                description: 'Não foi possível identificar o usuário. Por favor, faça login novamente.'
            });
            return;
        }
        
        setUpdatingPlan(newPlan);

        try {
            const result = await createStripeCheckoutAction(user.uid, user.email, newPlan as Exclude<UserPlan, 'Básico'>);
            if (result && result.url) {
                window.location.href = result.url;
            } else {
                 throw new Error(result.error || 'A resposta do servidor não continha a URL de checkout.');
            }
        } catch (error) {
            toast({ 
                variant: 'destructive', 
                title: 'Erro ao iniciar assinatura.',
                description: error instanceof Error ? error.message : 'Tente novamente mais tarde.'
            });
            console.error("Stripe checkout error:", error);
        } finally {
            setUpdatingPlan(null);
        }
    }

    return (
        <>
            {showCelebration && <UpgradeCelebration onComplete={() => setShowCelebration(false)} />}
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Assinatura e Créditos</h1>
                    <p className="text-muted-foreground">Gerencie seu plano e seu uso de créditos de IA.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                    {plans.map(plan => {
                        const isCurrent = plan.name === currentUserPlan;
                        const isLoading = updatingPlan === plan.name;
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
                                <Button 
                                    className="w-full" 
                                    disabled={isCurrent || isLoading || isPlanLoading} 
                                    onClick={() => handlePlanChange(plan.name as UserPlan)} 
                                    variant={isCurrent ? 'outline' : 'default'}
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : isCurrent ? "Seu Plano Atual" : plan.cta}
                                </Button>
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
        </>
    )
}

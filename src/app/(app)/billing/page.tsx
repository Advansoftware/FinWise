
// src/app/(app)/billing/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
        cta: "Seu Plano Atual",
        isCurrent: true,
    },
    {
        name: "Pro",
        price: "R$ 19,90/mês",
        description: "Eficiência e insights para otimizar seu tempo e dinheiro.",
        features: [
            "Tudo do plano Básico, e mais:",
            "Análises e dicas com IA ilimitadas",
            "Assistente de Chat com IA",
            "Relatórios inteligentes (Mensal/Anual)",
            "Escanear notas fiscais (OCR)",
            "Importação de extratos (CSV, OFX)",
            "Suporte prioritário",
        ],
        cta: "Fazer Upgrade",
        isCurrent: false,
    },
    {
        name: "Plus",
        price: "R$ 39,90/mês",
        description: "O piloto automático para sua vida financeira com IA preditiva.",
        features: [
            "Tudo do plano Pro, e mais:",
            "Orçamentos inteligentes e automáticos",
            "Previsão de gastos e saldos futuros",
            "Conciliação automática de transações",
            "Projeção de alcance de metas",
            "Acesso a novos recursos beta",
        ],
        cta: "Fazer Upgrade",
        isCurrent: false,
    }
]


export default function BillingPage() {
    
    const currentUserPlan = 'Básico'; 

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Assinatura</h1>
                <p className="text-muted-foreground">Gerencie seu plano e informações de pagamento.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {plans.map(plan => (
                     <Card 
                        key={plan.name} 
                        className={`flex flex-col ${plan.name === 'Pro' ? 'border-primary shadow-lg' : ''}`}
                     >
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>{plan.name}</CardTitle>
                                {plan.name === currentUserPlan && <Badge variant="secondary">Plano Atual</Badge>}
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
                                        <span className="text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                             </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" disabled={plan.name === currentUserPlan} variant={plan.name === 'Pro' ? 'default' : 'outline'}>
                                {plan.cta}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}

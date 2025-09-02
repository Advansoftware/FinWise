// src/app/(app)/billing/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const plans = [
    {
        name: "Básico",
        price: "Grátis",
        description: "Para quem está começando a organizar as finanças.",
        features: [
            "Dashboard com insights básicos",
            "Criação manual de transações",
            "Gerenciamento de categorias",
        ],
        cta: "Seu Plano Atual",
        isCurrent: true,
    },
    {
        name: "Pro",
        price: "R$19,90/mês",
        description: "Para controle total e insights avançados.",
        features: [
            "Tudo do plano Básico",
            "Assistente com IA para dicas financeiras",
            "Escanear notas fiscais (OCR)",
            "Importação de extratos bancários",
            "Suporte prioritário",
        ],
        cta: "Fazer Upgrade",
        isCurrent: false,
    }
]


export default function BillingPage() {
    const { user, loading } = useAuth();
    
    // Supondo que o plano do usuário venha do objeto 'user' ou de um documento do Firestore
    const currentUserPlan = 'Básico'; 

    if (loading) {
        return <BillingSkeleton />
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Assinatura</h1>
                <p className="text-muted-foreground">Gerencie seu plano e informações de pagamento.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plans.map(plan => (
                     <Card 
                        key={plan.name} 
                        className={`flex flex-col ${plan.name === currentUserPlan ? 'border-primary' : ''}`}
                     >
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>{plan.name}</CardTitle>
                                {plan.name === currentUserPlan && <Badge variant="secondary">Plano Atual</Badge>}
                            </div>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                             <div className="text-3xl font-bold">{plan.price}</div>
                             <ul className="space-y-2">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        <span className="text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                             </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" disabled={plan.name === currentUserPlan}>
                                {plan.cta}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}


function BillingSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
            </div>
        </div>
    )
}

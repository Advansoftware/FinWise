// src/app/(app)/budgets/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Banknote, Landmark } from "lucide-react";

export default function BudgetsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Orçamentos e Metas</h1>
                <p className="text-muted-foreground">Planeje seus gastos, defina metas de economia e configure suas fontes de renda.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Planejamento Futuro</CardTitle>
                    <CardDescription>Esta área está em desenvolvimento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">Em breve, você poderá:</p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>Criar orçamentos mensais para categorias específicas (ex: R$ 500 para Restaurantes).</li>
                        <li>Definir metas de economia (ex: Juntar R$ 1.000 para uma viagem).</li>
                        <li>Configurar e gerenciar múltiplas carteiras ou contas (ex: Carteira, Conta Corrente).</li>
                        <li>Analisar projeções de gastos futuros com base em seus hábitos.</li>
                    </ul>
                </CardContent>
            </Card>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-medium">Fontes de Renda</CardTitle>
                        <Banknote className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Você pode configurar suas fontes de renda (Salário, Vendas, etc.) como categorias na página <span className="font-semibold text-primary">Categorias</span>. 
                            Ao adicionar uma nova transação, basta marcá-la como "Receita".
                        </p>
                    </CardContent>
                </Card>
                 <Card className="bg-card/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-medium">Contas e Carteiras</CardTitle>
                        <Landmark className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                           A funcionalidade para gerenciar múltiplas contas (ex: NuBank, Santander, Carteira Física) será adicionada nesta tela de orçamentos futuramente.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

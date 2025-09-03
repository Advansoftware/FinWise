
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialProfileCard } from "@/components/profile/financial-profile-card";

export default function ProfilePage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Perfil e Análise</h1>
                <p className="text-muted-foreground">Descubra seu perfil financeiro. A IA analisa seus hábitos de consumo e cria um resumo para ajudá-lo a entender melhor para onde seu dinheiro vai.</p>
            </div>
            
            <FinancialProfileCard />
        </div>
    )
}

    

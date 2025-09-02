
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialProfileCard } from "@/components/profile/financial-profile-card";

export default function ProfilePage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Perfil e Análise</h1>
                <p className="text-muted-foreground">Veja uma análise do seu perfil financeiro gerada por IA.</p>
            </div>
            
            <FinancialProfileCard />
        </div>
    )
}

    
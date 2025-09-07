// src/app/(app)/profile/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialProfileCard } from "@/components/profile/financial-profile-card";
import { GamificationSummary } from "@/components/profile/gamification-summary";
import { UpdateNameForm } from "@/components/profile/update-name-form";
import { UpdatePasswordForm } from "@/components/profile/update-password-form";
import { usePlan } from "@/hooks/use-plan";
import { ProUpgradeCard } from "@/components/pro-upgrade-card";

export default function ProfilePage() {
    const { isPro } = usePlan();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Perfil e Configurações da Conta</h1>
                <p className="text-muted-foreground">Gerencie suas informações pessoais, segurança e veja a análise do seu perfil financeiro.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações da Conta</CardTitle>
                            <CardDescription>Atualize seu nome de exibição.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <UpdateNameForm />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Segurança</CardTitle>
                            <CardDescription>Altere sua senha.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <UpdatePasswordForm />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    {isPro ? (
                        <>
                            <FinancialProfileCard />
                            <GamificationSummary />
                        </>
                    ) : (
                        <ProUpgradeCard featureName="Análise de Perfil com IA" />
                    )}
                </div>
            </div>
        </div>
    )
}

// src/app/(app)/profile/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialProfileCard } from "@/components/profile/financial-profile-card";
import { GamificationSummary } from "@/components/profile/gamification-summary";
import { PayrollCard } from "@/components/profile/payroll-card";
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
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Primeira linha - Cards de configuração da conta */}
                <div className="lg:col-span-6">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Informações da Conta</CardTitle>
                            <CardDescription>Atualize seu nome de exibição.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <UpdateNameForm />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-6">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Segurança</CardTitle>
                            <CardDescription>Altere sua senha.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <UpdatePasswordForm />
                        </CardContent>
                    </Card>
                </div>

                {/* Segunda linha - Holerite e Perfil Financeiro */}
                <div className="lg:col-span-7">
                    <PayrollCard />
                </div>
                <div className="lg:col-span-5">
                    {isPro ? (
                        <FinancialProfileCard />
                    ) : (
                        <ProUpgradeCard featureName="Análise de Perfil com IA" />
                    )}
                </div>

                {/* Terceira linha - Gamificação (se Pro) */}
                {isPro && (
                    <div className="lg:col-span-12">
                        <GamificationSummary />
                    </div>
                )}
                
                {/* Gamificação como upgrade para não-Pro */}
                {!isPro && (
                    <div className="lg:col-span-12">
                        <ProUpgradeCard featureName="Progresso Gamificado" />
                    </div>
                )}
            </div>
        </div>
    )
}

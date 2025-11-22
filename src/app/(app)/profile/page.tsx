// src/app/(app)/profile/page.tsx
'use client';

import { Card, CardContent, CardHeader } from "@mui/material";
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
                            <Typography variant="h6">Informações da Conta</Typography>
                            <Typography variant="body2" color="text.secondary">Atualize seu nome de exibição.</Typography>
                        </CardHeader>
                        <CardContent>
                           <UpdateNameForm />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-6">
                    <Card className="h-full">
                        <CardHeader>
                            <Typography variant="h6">Segurança</Typography>
                            <Typography variant="body2" color="text.secondary">Altere sua senha.</Typography>
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

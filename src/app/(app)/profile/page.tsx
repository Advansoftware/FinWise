'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpdateNameForm } from "@/components/profile/update-name-form";
import { UpdatePasswordForm } from "@/components/profile/update-password-form";
import { FinancialProfileCard } from "@/components/profile/financial-profile-card";

export default function ProfilePage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Perfil e Análise</h1>
                <p className="text-muted-foreground">Atualize suas informações e veja uma análise do seu perfil.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Tabs defaultValue="name" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 max-w-md">
                            <TabsTrigger value="name">Nome</TabsTrigger>
                            <TabsTrigger value="password">Senha</TabsTrigger>
                        </TabsList>
                        <TabsContent value="name">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Nome de Exibição</CardTitle>
                                    <CardDescription>
                                        Este será o nome exibido na sua conta e nos e-mails.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                <UpdateNameForm />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="password">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Senha</CardTitle>
                                    <CardDescription>
                                        Escolha uma nova senha para manter sua conta segura.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                <UpdatePasswordForm />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="lg:col-span-1">
                    <FinancialProfileCard />
                </div>
            </div>
        </div>
    )
}

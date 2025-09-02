// src/app/(app)/profile/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpdateNameForm } from "@/components/profile/update-name-form";
import { UpdatePasswordForm } from "@/components/profile/update-password-form";

export default function ProfilePage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
                <p className="text-muted-foreground">Atualize as informações da sua conta.</p>
            </div>

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
    )
}

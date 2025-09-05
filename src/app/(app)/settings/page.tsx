// src/app/(app)/settings/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAISettings } from "@/hooks/use-ai-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreVertical, Trash2, Edit, PlusCircle, CheckCircle, Radio, Sparkles, Lock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AISettingsDialog } from "@/components/settings/ai-settings-dialog";
import { usePlan } from "@/hooks/use-plan";
import { AICredential } from "@/lib/types";
import { ProUpgradeCard } from "@/components/pro-upgrade-card";

export default function SettingsPage() {
    const {
        isLoading,
        displayedCredentials,
        activeCredentialId,
        handleActivate,
        handleDelete,
        handleOpenDialog,
        isDialogOpen,
        setIsDialogOpen,
        editingCredential
    } = useAISettings();
    const { plan, isLoading: isPlanLoading, isPro, isPlus, isInfinity } = usePlan();

    if (isLoading || isPlanLoading) {
        return <SettingsSkeleton />;
    }

    // Block page for Basic plan users
    if (plan === 'Básico') {
        return <ProUpgradeCard featureName="Configurações de IA" />;
    }

    const canAddOllama = isPlus && displayedCredentials.filter(c => c.provider === 'ollama').length === 0;
    const canAddMore = isInfinity;

    return (
        <div className="flex flex-col gap-6">
             <AISettingsDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} initialData={editingCredential} />
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Configurações de IA</h1>
                    <p className="text-muted-foreground">Gerencie suas credenciais de IA. A credencial ativa será usada para todos os recursos.</p>
                </div>
                <Button onClick={() => handleOpenDialog(null)} disabled={!canAddOllama && !canAddMore}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Nova Credencial
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Credenciais Disponíveis</CardTitle>
                    <CardDescription>Apenas a IA da credencial ativa consome seus créditos Gastometria.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {displayedCredentials.map(cred => {
                             const isActive = cred.id === activeCredentialId;
                             return (
                                <div key={cred.id} className={`flex items-center p-4 rounded-lg border ${isActive ? 'border-primary bg-primary/5' : ''}`}>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            {isActive ? <CheckCircle className="h-5 w-5 text-primary"/> : <Radio className="h-5 w-5 text-muted-foreground"/>}
                                            <p className="font-semibold">{cred.name}</p>
                                            <Badge variant={cred.provider === 'gastometria' ? 'default' : 'secondary'}>{cred.provider}</Badge>
                                             {cred.isReadOnly && <Lock className="h-3 w-3 text-muted-foreground" />}
                                        </div>
                                        <p className="text-sm text-muted-foreground pl-7">
                                            {cred.provider === 'gastometria' && 'IA otimizada e integrada ao Gastometria (usa créditos).'}
                                            {cred.provider === 'ollama' && `Modelo: ${cred.ollamaModel} @ ${cred.ollamaServerAddress}`}
                                            {cred.provider === 'googleai' && `Google AI (Gemini)`}
                                            {cred.provider === 'openai' && `Modelo: ${cred.openAIModel}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!isActive && (
                                            <Button variant="ghost" size="sm" onClick={() => handleActivate(cred.id)}>Ativar</Button>
                                        )}
                                         {!cred.isReadOnly && (
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4"/>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                     <DropdownMenuItem onClick={() => handleOpenDialog(cred)}>
                                                        <Edit className="mr-2 h-4 w-4"/> Editar
                                                     </DropdownMenuItem>
                                                      <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                 <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:text-red-400 focus:bg-destructive/10">
                                                                    <Trash2 className="mr-2 h-4 w-4"/>Excluir
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a credencial "{cred.name}".
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete(cred.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                </DropdownMenuContent>
                                             </DropdownMenu>
                                         )}
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


function SettingsSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-10 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                 <Skeleton className="h-10 w-36" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-4">
                   <Skeleton className="h-20 w-full" />
                   <Skeleton className="h-20 w-full" />
                   <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

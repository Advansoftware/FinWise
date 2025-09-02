
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";
import { useAISettings } from "@/hooks/use-ai-settings";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
    const {
        form,
        isSaving,
        isLoading,
        isFetchingOllama,
        ollamaModels,
        provider,
        ollamaAddress,
        fetchOllamaModels,
        onSubmit,
    } = useAISettings();

    if (isLoading) {
        return <SettingsSkeleton />
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações de IA</h1>
                <p className="text-muted-foreground">Gerencie os modelos e provedores de Inteligência Artificial.</p>
            </div>
            
            <Card>
                 <CardHeader>
                    <CardTitle>Provedor de IA</CardTitle>
                    <CardDescription>Escolha qual serviço de IA você deseja usar para os recursos inteligentes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
                             <FormField
                                control={form.control}
                                name="provider"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Provedor</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um provedor de IA" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        <SelectItem value="ollama">Ollama (Local/Remoto)</SelectItem>
                                        <SelectItem value="googleai">Google AI</SelectItem>
                                        <SelectItem value="openai">OpenAI</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            
                            {provider === 'ollama' && (
                                <>
                                 <FormField
                                    control={form.control}
                                    name="ollamaServerAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Endereço do Servidor Ollama</FormLabel>
                                        <FormControl>
                                            <Input placeholder="http://127.0.0.1:11434" {...field} />
                                        </FormControl>
                                        <FormDescription>A URL onde o seu servidor Ollama está acessível.</FormDescription>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                <FormField
                                    control={form.control}
                                    name="ollamaModel"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Modelo Ollama</FormLabel>
                                        <div className="flex gap-2">
                                            <Select onValueChange={field.onChange} value={field.value} disabled={isFetchingOllama || ollamaModels.length === 0}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={ollamaModels.length > 0 ? "Selecione um modelo" : "Nenhum modelo encontrado"} />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                {ollamaModels.map(model => (
                                                    <SelectItem key={model} value={model}>{model}</SelectItem>
                                                ))}
                                                </SelectContent>
                                            </Select>
                                            <Button type="button" variant="ghost" size="icon" onClick={fetchOllamaModels} disabled={isFetchingOllama || !ollamaAddress}>
                                                <RefreshCw className={`h-4 w-4 ${isFetchingOllama ? 'animate-spin': ''}`} />
                                            </Button>
                                        </div>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                </>
                            )}

                             {provider === 'googleai' && (
                                <FormField
                                    control={form.control}
                                    name="googleAIApiKey"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Chave de API - Google AI</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Cole sua chave de API aqui" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {provider === 'openai' && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="openAIModel"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Modelo OpenAI</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um modelo OpenAI" />
                                                </Trigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="openAIApiKey"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Chave de API - OpenAI</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Cole sua chave de API aqui" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}

                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Salvar Configurações
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}


function SettingsSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-6 max-w-lg">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </CardContent>
            </Card>
        </div>
    )
}

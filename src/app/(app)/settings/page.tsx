// src/app/(app)/settings/page.tsx
'use client';

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AISettings } from "@/lib/types";
import { saveAISettings, getAISettings, getOllamaModels } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const aiSettingsSchema = z.object({
  provider: z.enum(["ollama", "googleai", "openai"]),
  ollamaModel: z.string().optional(),
  googleAIApiKey: z.string().optional(),
  openAIModel: z.enum(["gpt-3.5-turbo", "gpt-4"]).optional(),
  openAIApiKey: z.string().optional(),
});

export default function SettingsPage() {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [ollamaModels, setOllamaModels] = useState<string[]>([]);
    const [isFetchingOllama, startFetchingOllama] = useTransition();

    const form = useForm<z.infer<typeof aiSettingsSchema>>({
        resolver: zodResolver(aiSettingsSchema),
        defaultValues: {
            provider: "ollama",
        },
    });

    const provider = form.watch("provider");

    const fetchOllamaModels = () => {
        startFetchingOllama(async () => {
            const models = await getOllamaModels();
            setOllamaModels(models);
            if (models.length === 0) {
                 toast({
                    variant: 'destructive',
                    title: 'Ollama não encontrado',
                    description: 'Não foi possível conectar ao Ollama. Certifique-se de que ele está em execução.',
                });
            }
        });
    }

    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            const settings = await getAISettings();
            form.reset(settings);
            if (settings.provider === 'ollama') {
               fetchOllamaModels();
            }
            setIsLoading(false);
        };
        loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form]);

    const onSubmit = async (data: z.infer<typeof aiSettingsSchema>) => {
        setIsSaving(true);
        await saveAISettings(data);
        toast({
            title: "Configurações Salvas!",
            description: "Suas configurações de IA foram atualizadas com sucesso.",
        });
        setIsSaving(false);
    };

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
                                    <Select onValueChange={(value) => { field.onChange(value); if (value === 'ollama') fetchOllamaModels(); }} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um provedor de IA" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        <SelectItem value="ollama">Ollama (Local)</SelectItem>
                                        <SelectItem value="googleai">Google AI</SelectItem>
                                        <SelectItem value="openai">OpenAI</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            
                            {provider === 'ollama' && (
                                <FormField
                                    control={form.control}
                                    name="ollamaModel"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Modelo Ollama</FormLabel>
                                        <div className="flex gap-2">
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFetchingOllama || ollamaModels.length === 0}>
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
                                            <Button type="button" variant="ghost" size="icon" onClick={fetchOllamaModels} disabled={isFetchingOllama}>
                                                <RefreshCw className={`h-4 w-4 ${isFetchingOllama ? 'animate-spin': ''}`} />
                                            </Button>
                                        </div>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um modelo OpenAI" />
                                                </SelectTrigger>
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
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Configurações
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
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
                    <Skeleton className="h-10 w-36" />
                </CardContent>
            </Card>
        </div>
    )
}

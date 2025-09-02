
'use client';

import { useEffect, useState, useTransition, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AISettings } from "@/lib/types";
import { saveAISettings, getAISettings, getOllamaModels } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const aiSettingsSchema = z.object({
  provider: z.enum(["ollama", "googleai", "openai"]),
  ollamaModel: z.string().optional(),
  ollamaServerAddress: z.string().url({ message: "Por favor, insira uma URL válida." }).optional(),
  googleAIApiKey: z.string().optional(),
  openAIModel: z.enum(["gpt-3.5-turbo", "gpt-4"]).optional(),
  openAIApiKey: z.string().optional(),
});

export default function SettingsPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [ollamaModels, setOllamaModels] = useState<string[]>([]);
    const [isFetchingOllama, startFetchingOllama] = useTransition();

    const form = useForm<z.infer<typeof aiSettingsSchema>>({
        resolver: zodResolver(aiSettingsSchema),
        defaultValues: {
            provider: "ollama",
            ollamaServerAddress: "http://127.0.0.1:11434"
        },
    });

    const provider = form.watch("provider");
    const ollamaAddress = form.watch("ollamaServerAddress");

    const fetchOllamaModels = useCallback(() => {
        const address = form.getValues("ollamaServerAddress");
        if (!address) {
            toast({ variant: 'destructive', title: 'Endereço do Servidor Ollama Necessário' });
            return;
        }
        startFetchingOllama(async () => {
            try {
                const models = await getOllamaModels(address);
                setOllamaModels(models);
                if (models.length === 0) {
                     toast({
                        variant: 'destructive',
                        title: 'Ollama não encontrado',
                        description: `Não foi possível conectar ao Ollama em ${address}. Verifique o endereço e se o serviço está em execução.`,
                    });
                }
            } catch(e) {
                 toast({
                    variant: 'destructive',
                    title: 'Falha na Conexão',
                    description: `Não foi possível conectar ao Ollama em ${address}. Verifique o endereço e se o serviço está em execução.`,
                });
            }
        });
    }, [form, toast]);

    useEffect(() => {
        const loadSettings = async () => {
            if (!user) return;
            try {
                const settings = await getAISettings(user.uid);
                form.reset(settings);
                if (settings.provider === 'ollama' && settings.ollamaServerAddress) {
                    fetchOllamaModels();
                }
            } catch (error) {
                console.error("Failed to load AI settings:", error);
                toast({
                    variant: "destructive",
                    title: "Erro ao Carregar Configurações",
                    description: "Não foi possível buscar suas configurações de IA salvas.",
                });
            }
        };
        loadSettings();
    }, [user, form, toast, fetchOllamaModels]);

    const onSubmit = async (data: z.infer<typeof aiSettingsSchema>) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado para salvar as configurações.' });
            return;
        }
        setIsSaving(true);
        try {
            await saveAISettings(user.uid, data);
            toast({
                title: "Configurações Salvas!",
                description: "Suas configurações de IA foram atualizadas com sucesso. A página será recarregada para aplicar as mudanças.",
            });
            setTimeout(() => window.location.reload(), 1500); 
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Não foi possível salvar as configurações.';
            toast({ variant: 'destructive', title: 'Erro', description: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };

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
                                            <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isFetchingOllama || ollamaModels.length === 0}>
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

                            <Button type="submit" disabled={isSaving || !user}>
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

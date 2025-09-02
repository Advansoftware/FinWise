
'use client';

import { useEffect, useState, useTransition, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AISettings } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getFirebase } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const aiSettingsSchema = z.object({
  provider: z.enum(["ollama", "googleai", "openai"]),
  ollamaModel: z.string().optional(),
  ollamaServerAddress: z.string().url({ message: "Por favor, insira uma URL válida." }).optional(),
  googleAIApiKey: z.string().optional(),
  openAIModel: z.enum(["gpt-3.5-turbo", "gpt-4"]).optional(),
  openAIApiKey: z.string().optional(),
});

type AISettingsForm = z.infer<typeof aiSettingsSchema>;

const DEFAULT_VALUES: AISettingsForm = {
    provider: "ollama",
    ollamaServerAddress: "http://127.0.0.1:11434",
    openAIModel: "gpt-3.5-turbo",
};

export function useAISettings() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [ollamaModels, setOllamaModels] = useState<string[]>([]);
    const [isFetchingOllama, startFetchingOllama] = useTransition();

    const form = useForm<AISettingsForm>({
        resolver: zodResolver(aiSettingsSchema),
        defaultValues: DEFAULT_VALUES,
    });

    const provider = form.watch("provider");
    const ollamaAddress = form.watch("ollamaServerAddress");

    const fetchOllamaModels = useCallback(async () => {
        const address = form.getValues("ollamaServerAddress");
        if (!address) {
            toast({ variant: 'destructive', title: 'Endereço do Servidor Ollama Necessário' });
            return;
        }
        startFetchingOllama(async () => {
            try {
                const response = await fetch('/api/ollama-proxy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: `${address}/api/tags` }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to fetch");
                }
                const data = await response.json();
                const models = data.models.map((model: any) => model.name.replace(':latest', ''));
                setOllamaModels(models);
                if (models.length === 0) {
                     toast({
                        variant: 'destructive',
                        title: 'Nenhum modelo Ollama encontrado',
                        description: `Verifique se o Ollama está em execução em ${address}.`,
                    });
                }
            } catch(e: any) {
                 toast({
                    variant: 'destructive',
                    title: 'Falha na Conexão com Ollama',
                    description: e.message || `Não foi possível conectar ao Ollama em ${address}.`,
                });
                setOllamaModels([]);
            }
        });
    }, [form, toast]);


    useEffect(() => {
        const loadSettings = async () => {
            if (!user) {
                // Se não há usuário, não há o que carregar, então para o loading.
                // O formulário já tem os valores padrão.
                setIsLoading(false);
                return;
            };

            setIsLoading(true);
            const { db } = getFirebase();
            const settingsRef = doc(db, "users", user.uid, "settings", "ai");

            try {
                const docSnap = await getDoc(settingsRef);
                 if (docSnap.exists()) {
                    const settings = docSnap.data() as AISettings;
                    form.reset(settings);
                    if (settings.provider === 'ollama') {
                       // Não busca modelos automaticamente ao carregar para evitar chamadas desnecessárias
                       // O usuário pode clicar no botão de refresh se precisar.
                    }
                } else {
                    // Nenhuma configuração salva, formulário permanece com os padrões
                }
            } catch (error) {
                console.error("Failed to load AI settings:", error);
                toast({
                    variant: "destructive",
                    title: "Erro ao Carregar Configurações",
                    description: "Não foi possível buscar suas configurações de IA salvas.",
                });
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, [user, toast, form]); 

    const onSubmit = async (data: AISettingsForm) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado para salvar as configurações.' });
            return;
        }

        setIsSaving(true);
        
        // Garante que apenas os campos relevantes para o provedor sejam salvos
        const settingsToSave: Partial<AISettings> = { provider: data.provider };
        
        if (data.provider === 'ollama') {
            settingsToSave.ollamaModel = data.ollamaModel;
            settingsToSave.ollamaServerAddress = data.ollamaServerAddress;
        } else if (data.provider === 'googleai') {
            settingsToSave.googleAIApiKey = data.googleAIApiKey;
        } else if (data.provider === 'openai') {
            settingsToSave.openAIModel = data.openAIModel;
            settingsToSave.openAIApiKey = data.openAIApiKey;
        }

        try {
            const { db } = getFirebase();
            const settingsRef = doc(db, "users", user.uid, "settings", "ai");
            // Usar merge: true para não sobrescrever campos não relacionados
            await setDoc(settingsRef, settingsToSave, { merge: true });

            toast({
                title: "Configurações Salvas!",
                description: "Suas configurações de IA foram atualizadas com sucesso.",
            });
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Não foi possível salvar as configurações.';
            toast({ variant: 'destructive', title: 'Erro ao Salvar', description: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };
    
    // Efeito para buscar modelos Ollama apenas quando o usuário explicitamente seleciona Ollama
    useEffect(() => {
        if (provider === 'ollama' && form.formState.isDirty) { // Apenas se o usuário mudou o campo
            fetchOllamaModels();
        }
    }, [provider, fetchOllamaModels, form.formState.isDirty]);

    return {
        form,
        isLoading,
        isSaving,
        isFetchingOllama,
        ollamaModels,
        provider,
        ollamaAddress,
        fetchOllamaModels,
        onSubmit,
    };
}

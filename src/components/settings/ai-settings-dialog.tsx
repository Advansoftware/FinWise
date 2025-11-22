

'use client';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogTitle, DialogActions } from "@mui/material";
import { Button } from "@mui/material";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/mui-wrappers/form";
import { TextField, Select, MenuItem, Box, Typography } from "@mui/material";
import { useToast } from "@/hooks/use-toast";
import { AICredential, AIProvider, OpenAIModel } from "@/lib/types";
import { useAISettings } from "@/hooks/use-ai-settings";
import { useEffect, useState, useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { usePlan } from "@/hooks/use-plan";


const credentialSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "O nome é obrigatório."),
  provider: z.enum(["ollama", "googleai", "openai", "gastometria"]),
  ollamaModel: z.string().optional(),
  ollamaServerAddress: z.string().optional(),
  googleAIApiKey: z.string().optional(),
  openAIModel: z.enum(["gpt-3.5-turbo", "gpt-4", "gpt-4-vision-preview", "gpt-4o", "gpt-4o-mini", "gpt-4-turbo"]).optional(),
  openAIApiKey: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.provider === 'ollama') {
        if (!data.ollamaModel) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O modelo Ollama é obrigatório.", path: ["ollamaModel"] });
        }
        if (!data.ollamaServerAddress) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O endereço do servidor é obrigatório.", path: ["ollamaServerAddress"] });
        } else {
            try {
                new URL(data.ollamaServerAddress);
            } catch (error) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "URL do servidor inválida.", path: ["ollamaServerAddress"] });
            }
        }
    }
    if (data.provider === 'googleai' && !data.googleAIApiKey) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A chave de API do Google AI é obrigatória.", path: ["googleAIApiKey"] });
    }
    if (data.provider === 'openai') {
       if (!data.openAIApiKey) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A chave de API do OpenAI é obrigatória.", path: ["openAIApiKey"] });
       }
       if (!data.openAIModel) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O modelo OpenAI é obrigatório.", path: ["openAIModel"] });
       }
    }
});

type CredentialFormValues = z.infer<typeof credentialSchema>;

interface AISettingsDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  initialData: AICredential | null;
}

export function AISettingsDialog({ isOpen, setIsOpen, initialData }: AISettingsDialogProps) {
  const { toast } = useToast();
  const { handleSaveCredential, isSaving } = useAISettings();
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isFetchingOllama, startFetchingOllama] = useTransition();
  const { isPlus, isInfinity } = usePlan();

  const form = useForm<CredentialFormValues>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      name: "",
      provider: "ollama",
      ollamaServerAddress: "http://127.0.0.1:11434",
      openAIModel: "gpt-4o-mini",
    },
  });

  const provider = form.watch("provider");

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            form.reset(initialData);
        } else {
            form.reset({
                name: "",
                provider: "ollama",
                ollamaServerAddress: "http://127.0.0.1:11434",
                openAIModel: "gpt-4o-mini",
            });
        }
    }
  }, [initialData, form, isOpen]);

  const fetchOllamaModels = async () => {
    const address = form.getValues("ollamaServerAddress");
    if (!address) {
        toast({ variant: "error", title: 'Endereço do Servidor Ollama Necessário' });
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
                    variant: "error",
                    title: 'Nenhum modelo Ollama encontrado',
                    description: `Verifique se o Ollama está em execução em ${address}.`,
                });
            }
        } catch(e: any) {
             toast({
                variant: "error",
                title: 'Falha na Conexão com Ollama',
                description: e.message || `Não foi possível conectar ao Ollama em ${address}.`,
            });
            setOllamaModels([]);
        }
    });
  };

  const onSubmit = (data: CredentialFormValues) => {
    handleSaveCredential(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Credencial" : "Nova Credencial de IA"}</DialogTitle>
          <DialogDescription>
            Forneça os detalhes para a configuração de IA.
          </DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={onSubmit}>
             <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nome da Configuração</FormLabel>
                        <FormControl>
                            <TextField placeholder="Ex: Chave Pessoal OpenAI" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
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
                                {isPlus && <MenuItem value="ollama">Ollama (Local/Remoto)</MenuItem>}
                                {isInfinity && <MenuItem value="googleai">Google AI</MenuItem>}
                                {isInfinity && <MenuItem value="openai">OpenAI</MenuItem>}
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
                                    <TextField placeholder="http://127.0.0.1:11434" {...field} value={field.value || ''} />
                                </FormControl>
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
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={isFetchingOllama || ollamaModels.length === 0}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={ollamaModels.length > 0 ? "Selecione um modelo" : "Nenhum modelo encontrado"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ollamaModels.map(model => (
                                                <MenuItem key={model} value={model}>{model}</MenuItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" variant="text" size="icon" onClick={fetchOllamaModels} disabled={isFetchingOllama || !form.getValues("ollamaServerAddress")}>
                                        <RefreshCw style={{ width: '1rem', height: '1rem' }} className={isFetchingOllama ? 'animate-spin': ''} />
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </>
            )}

            {provider === 'googleai' && isInfinity && (
                <FormField
                    control={form.control}
                    name="googleAIApiKey"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Chave de API - Google AI</FormLabel>
                            <FormControl>
                                <TextField type="password" placeholder="Cole sua chave de API aqui" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            {provider === 'openai' && isInfinity && (
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
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <MenuItem value="gpt-4o">GPT-4o</MenuItem>
                                        <MenuItem value="gpt-4-vision-preview">GPT-4 Vision</MenuItem>
                                        <MenuItem value="gpt-4">GPT-4</MenuItem>
                                        <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
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
                                    <TextField type="password" placeholder="Cole sua chave de API aqui" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </>
            )}
             <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} className="animate-spin" />}
                    Salvar
                </Button>
            </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

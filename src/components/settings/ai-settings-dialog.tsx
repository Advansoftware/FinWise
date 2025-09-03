

'use client';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  provider: z.enum(["ollama", "googleai", "openai", "finwise"]),
  ollamaModel: z.string().optional(),
  ollamaServerAddress: z.string().optional(),
  googleAIApiKey: z.string().optional(),
  openAIModel: z.enum(["gpt-3.5-turbo", "gpt-4", "gpt-4-vision-preview", "gpt-4o"]).optional(),
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
      openAIModel: "gpt-4o",
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
                openAIModel: "gpt-4o",
            });
        }
    }
  }, [initialData, form, isOpen]);

  const fetchOllamaModels = async () => {
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nome da Configuração</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: Chave Pessoal OpenAI" {...field} />
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
                                {isPlus && <SelectItem value="ollama">Ollama (Local/Remoto)</SelectItem>}
                                {isInfinity && <SelectItem value="googleai">Google AI</SelectItem>}
                                {isInfinity && <SelectItem value="openai">OpenAI</SelectItem>}
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
                                    <Input placeholder="http://127.0.0.1:11434" {...field} value={field.value || ''} />
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
                                <div className="flex gap-2">
                                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={isFetchingOllama || ollamaModels.length === 0}>
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
                                    <Button type="button" variant="ghost" size="icon" onClick={fetchOllamaModels} disabled={isFetchingOllama || !form.getValues("ollamaServerAddress")}>
                                        <RefreshCw className={`h-4 w-4 ${isFetchingOllama ? 'animate-spin': ''}`} />
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
                                <Input type="password" placeholder="Cole sua chave de API aqui" {...field} value={field.value || ''} />
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
                                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                        <SelectItem value="gpt-4-vision-preview">GPT-4 Vision</SelectItem>
                                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
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
                                    <Input type="password" placeholder="Cole sua chave de API aqui" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </>
            )}
             <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

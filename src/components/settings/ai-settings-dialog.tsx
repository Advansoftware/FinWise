"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  Box,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
  IconButton,
  Alert,
  Chip,
} from "@mui/material";
import { Refresh as RefreshIcon, Warning as WarningIcon, CheckCircle as CheckCircleIcon } from "@mui/icons-material";
import { useToast } from "@/hooks/use-toast";
import { AICredential, WebLLMModel } from "@/lib/types";
import { useAISettings } from "@/hooks/use-ai-settings";
import { useWebLLM } from "@/hooks/use-webllm";
import { WebLLMProgressIndicator } from "./webllm-progress-indicator";
import { useEffect, useState, useTransition } from "react";
import { usePlan } from "@/hooks/use-plan";

// Requisitos mínimos para cada modelo WebLLM
const WEBLLM_MODELS: {
  id: WebLLMModel;
  name: string;
  vram: string;
  ram: string;
  description: string;
  recommended: boolean;
}[] = [
  {
    id: "gemma-2-2b-it-q4f16_1-MLC",
    name: "Gemma 2 2B",
    vram: "2GB",
    ram: "4GB",
    description: "Modelo leve, ideal para dispositivos com recursos limitados",
    recommended: false,
  },
  {
    id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
    name: "Phi-3.5 Mini",
    vram: "3GB",
    ram: "6GB",
    description: "Modelo compacto da Microsoft, bom equilíbrio entre tamanho e qualidade",
    recommended: false,
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B",
    vram: "3GB",
    ram: "6GB",
    description: "Modelo Meta compacto, bom para tarefas financeiras básicas",
    recommended: true,
  },
  {
    id: "Qwen2.5-7B-Instruct-q4f16_1-MLC",
    name: "Qwen 2.5 7B",
    vram: "6GB",
    ram: "10GB",
    description: "Modelo Alibaba, excelente para análises financeiras detalhadas",
    recommended: false,
  },
  {
    id: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
    name: "Llama 3.1 8B",
    vram: "6GB",
    ram: "12GB",
    description: "Modelo mais poderoso, melhor qualidade mas requer mais recursos",
    recommended: false,
  },
];

const credentialSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "O nome é obrigatório."),
    provider: z.enum(["ollama", "googleai", "openai", "gastometria", "webllm"]),
    ollamaModel: z.string().optional(),
    ollamaServerAddress: z.string().optional(),
    googleAIApiKey: z.string().optional(),
    openAIModel: z
      .enum(["gpt-3.5-turbo", "gpt-4", "gpt-4o", "gpt-4o-mini", "gpt-4-turbo"])
      .optional(),
    openAIApiKey: z.string().optional(),
    webLLMModel: z
      .enum([
        "Llama-3.2-3B-Instruct-q4f16_1-MLC",
        "Llama-3.1-8B-Instruct-q4f16_1-MLC",
        "Qwen2.5-7B-Instruct-q4f16_1-MLC",
        "Phi-3.5-mini-instruct-q4f16_1-MLC",
        "gemma-2-2b-it-q4f16_1-MLC",
      ])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.provider === "ollama") {
      if (!data.ollamaModel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "O modelo Ollama é obrigatório.",
          path: ["ollamaModel"],
        });
      }
      if (!data.ollamaServerAddress) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "O endereço do servidor é obrigatório.",
          path: ["ollamaServerAddress"],
        });
      } else {
        try {
          new URL(data.ollamaServerAddress);
        } catch (error) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "URL do servidor inválida.",
            path: ["ollamaServerAddress"],
          });
        }
      }
    }
    if (data.provider === "googleai" && !data.googleAIApiKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A chave de API do Google AI é obrigatória.",
        path: ["googleAIApiKey"],
      });
    }
    if (data.provider === "openai") {
      if (!data.openAIApiKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A chave de API do OpenAI é obrigatória.",
          path: ["openAIApiKey"],
        });
      }
      if (!data.openAIModel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "O modelo OpenAI é obrigatório.",
          path: ["openAIModel"],
        });
      }
    }
    if (data.provider === "webllm" && !data.webLLMModel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O modelo WebLLM é obrigatório.",
        path: ["webLLMModel"],
      });
    }
  });

type CredentialFormValues = z.infer<typeof credentialSchema>;

interface AISettingsDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  initialData: AICredential | null;
}

export function AISettingsDialog({
  isOpen,
  setIsOpen,
  initialData,
}: AISettingsDialogProps) {
  const { toast } = useToast();
  const { handleSaveCredential, isSaving } = useAISettings();
  const { isSupported: isWebGPUSupported, isReady: isWebLLMReady, isLoading: isWebLLMLoading, currentModelId, progress: webllmProgress, loadModel: loadWebLLMModel } = useWebLLM();
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isFetchingOllama, startFetchingOllama] = useTransition();
  const [showWebLLMRequirements, setShowWebLLMRequirements] = useState(false);
  const [selectedWebLLMModel, setSelectedWebLLMModel] = useState<WebLLMModel | null>(null);
  const { isPlus, isInfinity } = usePlan();

  const {
    control,
    handleSubmit,
    watch,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CredentialFormValues>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      name: "",
      provider: "ollama",
      ollamaServerAddress: "http://127.0.0.1:11434",
      openAIModel: "gpt-4o-mini",
      webLLMModel: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    },
  });

  const provider = watch("provider");
  const webLLMModel = watch("webLLMModel");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset(initialData);
      } else {
        reset({
          name: "",
          provider: "ollama",
          ollamaServerAddress: "http://127.0.0.1:11434",
          openAIModel: "gpt-4o-mini",
          webLLMModel: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
        });
      }
    }
  }, [initialData, reset, isOpen]);

  // Mostrar requisitos ao selecionar modelo WebLLM
  useEffect(() => {
    if (provider === "webllm" && webLLMModel) {
      setSelectedWebLLMModel(webLLMModel);
      setShowWebLLMRequirements(true);
    }
  }, [webLLMModel, provider]);

  const fetchOllamaModels = async () => {
    const address = getValues("ollamaServerAddress");
    if (!address) {
      toast({
        variant: "error",
        title: "Endereço do Servidor Ollama Necessário",
      });
      return;
    }
    startFetchingOllama(async () => {
      try {
        const response = await fetch("/api/ollama-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: `${address}/api/tags` }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch");
        }
        const data = await response.json();
        const models = data.models.map((model: any) =>
          model.name.replace(":latest", "")
        );
        setOllamaModels(models);
        if (models.length === 0) {
          toast({
            variant: "error",
            title: "Nenhum modelo Ollama encontrado",
            description: `Verifique se o Ollama está em execução em ${address}.`,
          });
        }
      } catch (e: any) {
        toast({
          variant: "error",
          title: "Falha na Conexão com Ollama",
          description:
            e.message || `Não foi possível conectar ao Ollama em ${address}.`,
        });
        setOllamaModels([]);
      }
    });
  };

  const onSubmit = (data: CredentialFormValues) => {
    handleSaveCredential(data);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {initialData ? "Editar Credencial" : "Nova Credencial de IA"}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Forneça os detalhes para a configuração de IA.
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          id="ai-settings-form"
        >
          <Stack spacing={2.5}>
            {/* Nome */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nome da Configuração"
                  placeholder="Ex: Chave Pessoal OpenAI"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />

            {/* Provedor */}
            <Controller
              name="provider"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.provider}>
                  <InputLabel>Provedor</InputLabel>
                  <Select {...field} label="Provedor">
                    {isPlus && (
                      <MenuItem value="ollama">Ollama (Local/Remoto)</MenuItem>
                    )}
                    {isPlus && (
                      <MenuItem value="webllm">WebLLM (Navegador)</MenuItem>
                    )}
                    {isInfinity && (
                      <MenuItem value="googleai">Google AI</MenuItem>
                    )}
                    {isInfinity && <MenuItem value="openai">OpenAI</MenuItem>}
                  </Select>
                  {errors.provider && (
                    <FormHelperText>{errors.provider.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            {/* Campos Ollama */}
            {provider === "ollama" && (
              <>
                <Controller
                  name="ollamaServerAddress"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Endereço do Servidor Ollama"
                      placeholder="http://127.0.0.1:11434"
                      error={!!errors.ollamaServerAddress}
                      helperText={errors.ollamaServerAddress?.message}
                      value={field.value || ""}
                    />
                  )}
                />

                <Controller
                  name="ollamaModel"
                  control={control}
                  render={({ field }) => (
                    <FormControl error={!!errors.ollamaModel}>
                      <InputLabel>Modelo Ollama</InputLabel>
                      <Stack direction="row" spacing={1}>
                        <Select
                          {...field}
                          label="Modelo Ollama"
                          disabled={
                            isFetchingOllama || ollamaModels.length === 0
                          }
                          displayEmpty
                          value={field.value || ""}
                          sx={{ flex: 1 }}
                        >
                          <MenuItem value="" disabled>
                            {ollamaModels.length > 0
                              ? "Selecione um modelo"
                              : "Nenhum modelo encontrado"}
                          </MenuItem>
                          {ollamaModels.map((model) => (
                            <MenuItem key={model} value={model}>
                              {model}
                            </MenuItem>
                          ))}
                        </Select>
                        <IconButton
                          onClick={fetchOllamaModels}
                          disabled={
                            isFetchingOllama ||
                            !getValues("ollamaServerAddress")
                          }
                          sx={{
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 1,
                          }}
                        >
                          {isFetchingOllama ? (
                            <CircularProgress size={20} />
                          ) : (
                            <RefreshIcon />
                          )}
                        </IconButton>
                      </Stack>
                      {errors.ollamaModel && (
                        <FormHelperText>
                          {errors.ollamaModel.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </>
            )}

            {/* Campos Google AI */}
            {provider === "googleai" && isInfinity && (
              <Controller
                name="googleAIApiKey"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Chave de API - Google AI"
                    type="password"
                    placeholder="Cole sua chave de API aqui"
                    error={!!errors.googleAIApiKey}
                    helperText={errors.googleAIApiKey?.message}
                    value={field.value || ""}
                  />
                )}
              />
            )}

            {/* Campos OpenAI */}
            {provider === "openai" && isInfinity && (
              <>
                <Controller
                  name="openAIModel"
                  control={control}
                  render={({ field }) => (
                    <FormControl error={!!errors.openAIModel}>
                      <InputLabel>Modelo OpenAI</InputLabel>
                      <Select
                        {...field}
                        label="Modelo OpenAI"
                        value={field.value || ""}
                      >
                        <MenuItem value="gpt-4o">GPT-4o (Recomendado)</MenuItem>
                        <MenuItem value="gpt-4o-mini">GPT-4o Mini</MenuItem>
                        <MenuItem value="gpt-4-turbo">GPT-4 Turbo</MenuItem>
                        <MenuItem value="gpt-4">GPT-4</MenuItem>
                        <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                      </Select>
                      {errors.openAIModel && (
                        <FormHelperText>
                          {errors.openAIModel.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  )}
                />

                <Controller
                  name="openAIApiKey"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Chave de API - OpenAI"
                      type="password"
                      placeholder="Cole sua chave de API aqui"
                      error={!!errors.openAIApiKey}
                      helperText={errors.openAIApiKey?.message}
                      value={field.value || ""}
                    />
                  )}
                />
              </>
            )}

            {/* Campos WebLLM */}
            {provider === "webllm" && isPlus && (
              <>
                <Alert severity="info" icon={<WarningIcon />} sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    WebLLM executa modelos de IA diretamente no seu navegador
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Não requer servidor externo, mas precisa de um navegador moderno com WebGPU.
                    O download inicial pode demorar alguns minutos.
                  </Typography>
                </Alert>

                {/* Status WebGPU */}
                {!isWebGPUSupported && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      Seu navegador não suporta WebGPU. Use Chrome 113+ ou Edge 113+.
                    </Typography>
                  </Alert>
                )}

                <Controller
                  name="webLLMModel"
                  control={control}
                  render={({ field }) => (
                    <FormControl error={!!errors.webLLMModel}>
                      <InputLabel>Modelo WebLLM</InputLabel>
                      <Select
                        {...field}
                        label="Modelo WebLLM"
                        value={field.value || ""}
                        disabled={!isWebGPUSupported}
                      >
                        {WEBLLM_MODELS.map((model) => (
                          <MenuItem key={model.id} value={model.id}>
                            <Stack direction="row" alignItems="center" spacing={1} width="100%">
                              <Typography>{model.name}</Typography>
                              {model.recommended && (
                                <Chip label="Recomendado" size="small" color="primary" />
                              )}
                              {currentModelId === model.id && isWebLLMReady && (
                                <Chip 
                                  label="Carregado" 
                                  size="small" 
                                  color="success" 
                                  icon={<CheckCircleIcon />}
                                />
                              )}
                            </Stack>
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.webLLMModel && (
                        <FormHelperText>{errors.webLLMModel.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />

                {/* Informações do modelo selecionado */}
                {webLLMModel && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "action.hover",
                      border: 1,
                      borderColor: "divider",
                    }}
                  >
                    {(() => {
                      const model = WEBLLM_MODELS.find((m) => m.id === webLLMModel);
                      if (!model) return null;
                      return (
                        <Stack spacing={1}>
                          <Typography variant="subtitle2" color="primary">
                            Requisitos Mínimos
                          </Typography>
                          <Stack direction="row" spacing={2}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                VRAM (GPU)
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {model.vram}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                RAM
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {model.ram}
                              </Typography>
                            </Box>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {model.description}
                          </Typography>

                          {/* Indicador de progresso melhorado */}
                          {(isWebLLMLoading || (currentModelId === webLLMModel && isWebLLMReady)) && (
                            <Box sx={{ mt: 2 }}>
                              <WebLLMProgressIndicator
                                progress={webllmProgress}
                                isLoading={isWebLLMLoading}
                                isReady={currentModelId === webLLMModel && isWebLLMReady}
                                modelId={currentModelId}
                                variant="full"
                              />
                            </Box>
                          )}

                          {/* Botão para pré-carregar */}
                          {isWebGPUSupported && currentModelId !== webLLMModel && !isWebLLMLoading && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => loadWebLLMModel(webLLMModel as any)}
                              sx={{ mt: 1 }}
                            >
                              Pré-carregar modelo agora
                            </Button>
                          )}

                          <Alert severity="warning" sx={{ mt: 1 }}>
                            <Typography variant="caption">
                              ⚠️ Certifique-se de que seu navegador suporta WebGPU. 
                              Chrome 113+ e Edge 113+ são recomendados.
                            </Typography>
                          </Alert>
                        </Stack>
                      );
                    })()}
                  </Box>
                )}
              </>
            )}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setIsOpen(false)} color="inherit">
          Cancelar
        </Button>
        <Button
          type="submit"
          form="ai-settings-form"
          disabled={isSaving}
          variant="contained"
          startIcon={
            isSaving ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

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
} from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";
import { useToast } from "@/hooks/use-toast";
import { AICredential } from "@/lib/types";
import { useAISettings } from "@/hooks/use-ai-settings";
import { useEffect, useState, useTransition } from "react";
import { usePlan } from "@/hooks/use-plan";

const credentialSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "O nome é obrigatório."),
    provider: z.enum(["ollama", "googleai", "openai", "gastometria"]),
    ollamaModel: z.string().optional(),
    ollamaServerAddress: z.string().optional(),
    googleAIApiKey: z.string().optional(),
    openAIModel: z
      .enum([
        "gpt-3.5-turbo",
        "gpt-4",
        "gpt-4-vision-preview",
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo",
      ])
      .optional(),
    openAIApiKey: z.string().optional(),
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
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isFetchingOllama, startFetchingOllama] = useTransition();
  const { isPlus, isInfinity } = usePlan();

  const {
    control,
    handleSubmit,
    watch,
    reset,
    getValues,
    formState: { errors },
  } = useForm<CredentialFormValues>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      name: "",
      provider: "ollama",
      ollamaServerAddress: "http://127.0.0.1:11434",
      openAIModel: "gpt-4o-mini",
    },
  });

  const provider = watch("provider");

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
        });
      }
    }
  }, [initialData, reset, isOpen]);

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
                        <MenuItem value="gpt-4o">GPT-4o</MenuItem>
                        <MenuItem value="gpt-4-vision-preview">
                          GPT-4 Vision
                        </MenuItem>
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

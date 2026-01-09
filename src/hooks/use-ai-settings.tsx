// src/hooks/use-ai-settings.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { AICredential } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { v4 as uuidv4 } from "uuid";
import { usePlan } from "./use-plan";
import { useMemo } from "react";
import { useDataRefresh } from "./use-data-refresh";

const GASTOMETRIA_AI_CREDENTIAL_ID = "gastometria-ai-default";

const gastometriaAICredential = {
  id: GASTOMETRIA_AI_CREDENTIAL_ID,
  name: "Gastometria AI",
  provider: "gastometria",
  isReadOnly: true,
} as const;

export function useAISettings() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { plan, isPro, isPlus, isInfinity } = usePlan();
  const { registerRefreshHandler, unregisterRefreshHandler, triggerRefresh } =
    useDataRefresh();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<{
    credentials: AICredential[];
    activeCredentialId: string | null;
  } | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] =
    useState<AICredential | null>(null);

  // Function to load settings
  const loadSettings = useCallback(
    async (background = false) => {
      if (!user) return;

      if (!background) setIsLoading(true);
      try {
        const aiSettings = await apiClient.get("settings", user.uid);
        const aiData = aiSettings?.ai_settings;

        if (aiData) {
          setSettings(aiData);
        } else {
          setSettings({
            credentials: [],
            activeCredentialId: GASTOMETRIA_AI_CREDENTIAL_ID,
          });
        }
      } catch (error) {
        console.error("Erro ao carregar configurações de IA:", error);
        if (!background)
          setSettings({
            credentials: [],
            activeCredentialId: GASTOMETRIA_AI_CREDENTIAL_ID,
          });
      } finally {
        if (!background) setIsLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setSettings(null);
      return;
    }

    loadSettings();

    // Register this hook's refresh function with the global system
    // Use background refresh to avoid flashing skeleton
    registerRefreshHandler("ai-settings", () => loadSettings(true));

    return () => {
      unregisterRefreshHandler("ai-settings");
    };
  }, [
    user,
    authLoading,
    loadSettings,
    registerRefreshHandler,
    unregisterRefreshHandler,
  ]);

  const credentials = useMemo(() => settings?.credentials || [], [settings]);
  const activeCredentialId = useMemo(
    () => settings?.activeCredentialId || GASTOMETRIA_AI_CREDENTIAL_ID,
    [settings]
  );

  // Memoize displayed credentials to include the default Gastometria AI and filter based on plan
  const displayedCredentials = useMemo(() => {
    let userCredentials = credentials;

    if (isPlus && !isInfinity) {
      // Plus plan
      userCredentials = credentials.filter((c) => c.provider === "ollama");
    } else if (isPro && !isPlus) {
      // Pro plan
      userCredentials = [];
    }
    // Infinity plan sees all credentials

    return [gastometriaAICredential, ...userCredentials];
  }, [credentials, isPro, isPlus, isInfinity]);

  // Effect to reset active credential if it's no longer allowed by the current plan
  useEffect(() => {
    if (!user || authLoading || !settings) return;

    // Só resetar se a credencial ativa não for do Gastometria E não existir nas credenciais exibidas
    const activeCredExistsInDisplayed = displayedCredentials.some(
      (c) => c.id === activeCredentialId
    );

    // Se o usuário tem uma IA personalizada ativa e ela existe nas credenciais do usuário, manter
    if (activeCredentialId !== GASTOMETRIA_AI_CREDENTIAL_ID) {
      const userHasThisCredential = credentials.some(
        (c) => c.id === activeCredentialId
      );
      if (userHasThisCredential && activeCredExistsInDisplayed) {
        return; // Manter a configuração do usuário
      }
    }

    // Só resetar se realmente não existir
    if (
      !activeCredExistsInDisplayed &&
      activeCredentialId !== GASTOMETRIA_AI_CREDENTIAL_ID
    ) {
      handleActivate(GASTOMETRIA_AI_CREDENTIAL_ID);
    }
  }, [
    displayedCredentials,
    activeCredentialId,
    user,
    authLoading,
    settings,
    credentials,
  ]);

  // Function to save all settings
  const saveSettings = async (newSettings: {
    credentials: AICredential[];
    activeCredentialId: string | null;
  }) => {
    if (!user) {
      toast({ variant: "error", title: "Usuário não autenticado." });
      return;
    }
    setIsSaving(true);
    try {
      const currentSettings = (await apiClient.get("settings", user.uid)) || {};

      await apiClient.update("settings", user.uid, {
        ...currentSettings,
        ai_settings: newSettings,
      });

      toast({ title: "Configurações de IA salvas!" });
      setSettings(newSettings);
    } catch (error) {
      toast({ variant: "error", title: "Erro ao salvar configurações." });
      throw error; // Re-throw error to be caught by caller
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCredential = async (
    credentialData: Omit<AICredential, "id"> & { id?: string }
  ) => {
    const isEditing = !!credentialData.id;

    const finalCredential: Partial<AICredential> & {
      id?: string;
      name: string;
      provider: "ollama" | "googleai" | "openai" | "gastometria";
    } = {
      id: credentialData.id,
      name: credentialData.name,
      provider: credentialData.provider,
    };

    // Filter properties based on the provider
    if (credentialData.provider === "ollama") {
      finalCredential.ollamaModel = credentialData.ollamaModel;
      finalCredential.ollamaServerAddress = credentialData.ollamaServerAddress;
    } else if (credentialData.provider === "googleai") {
      finalCredential.googleAIApiKey = credentialData.googleAIApiKey;
    } else if (credentialData.provider === "openai") {
      finalCredential.openAIApiKey = credentialData.openAIApiKey;
      finalCredential.openAIModel = credentialData.openAIModel;
    }

    let newCredentials;

    if (isEditing) {
      newCredentials = credentials.map((c) =>
        c.id === finalCredential.id ? (finalCredential as AICredential) : c
      );
    } else {
      const newCredential = {
        ...finalCredential,
        id: uuidv4(),
      } as AICredential;
      newCredentials = [...credentials, newCredential];
    }

    const newActiveId =
      activeCredentialId ||
      (newCredentials.length === 1
        ? newCredentials[0].id
        : GASTOMETRIA_AI_CREDENTIAL_ID);

    try {
      await saveSettings({
        credentials: newCredentials,
        activeCredentialId: newActiveId,
      });

      // Await background refresh to ensure list is updated before closing modal
      await loadSettings(true);

      // Trigger global refresh for other components
      triggerRefresh("all");
    } catch (error) {
      console.error("Failed to save credential", error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    const newCredentials = credentials.filter((c) => c.id !== id);
    let newActiveId = activeCredentialId;
    if (activeCredentialId === id) {
      newActiveId = GASTOMETRIA_AI_CREDENTIAL_ID; // Fallback to default
    }

    try {
      await saveSettings({
        credentials: newCredentials,
        activeCredentialId: newActiveId,
      });

      // Trigger global refresh to update other components
      setTimeout(() => {
        triggerRefresh("all");
      }, 500);
    } catch (error) {
      console.error("Failed to delete credential", error);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      // Salvar as configurações com a nova credencial ativa
      const newSettings = { credentials, activeCredentialId: id };
      await saveSettings(newSettings);

      // Forçar atualização local para garantir que a mudança seja refletida imediatamente
      setSettings(newSettings);

      // Trigger global refresh to update other components
      setTimeout(() => {
        triggerRefresh("all");
      }, 500);
    } catch (error) {
      console.error("Failed to activate credential", error);
      toast({ variant: "error", title: "Erro ao ativar configuração de IA." });
    }
  };

  const handleOpenDialog = (credential: AICredential | null) => {
    setEditingCredential(credential);
    setIsDialogOpen(true);
  };

  return {
    isLoading: isLoading || authLoading,
    isSaving,
    credentials, // User-defined credentials
    displayedCredentials, // All credentials including Gastometria AI
    activeCredentialId,
    handleSaveCredential,
    handleDelete,
    handleActivate,
    isDialogOpen,
    setIsDialogOpen,
    editingCredential,
    handleOpenDialog,
  };
}

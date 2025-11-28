// src/hooks/use-webllm.tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { InitProgressReport } from '@mlc-ai/web-llm';
import { useAISettings } from './use-ai-settings';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import type { WebLLMModelId } from '@/services/webllm-service';
import { setActiveCredential } from '@/services/ai-service-router';
import { AICredential } from '@/lib/types';

export interface WebLLMState {
  isSupported: boolean;
  isLoading: boolean;
  isReady: boolean;
  currentModelId: WebLLMModelId | null;
  progress: InitProgressReport | null;
  error: string | null;
}

export interface UseWebLLMReturn extends WebLLMState {
  loadModel: (modelId?: WebLLMModelId) => Promise<void>;
  unloadModel: () => Promise<void>;
  generateText: (prompt: string, systemPrompt?: string) => Promise<string>;
  generateTextStream: (prompt: string, systemPrompt?: string) => AsyncGenerator<string, void, unknown>;
  resetChat: () => Promise<void>;
  isWebLLMActive: boolean;
}

export function useWebLLM(): UseWebLLMReturn {
  const { displayedCredentials, activeCredentialId } = useAISettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<WebLLMState>({
    isSupported: false,
    isLoading: false,
    isReady: false,
    currentModelId: null,
    progress: null,
    error: null,
  });

  const serviceRef = useRef<typeof import('@/services/webllm-service') | null>(null);

  // Verifica se a credencial ativa é WebLLM
  const activeCredential = displayedCredentials.find(c => c.id === activeCredentialId);
  const isWebLLMActive = activeCredential?.provider === 'webllm';

  // Sincroniza a credencial ativa com o router de IA
  useEffect(() => {
    if (user && activeCredential) {
      setActiveCredential(activeCredential as AICredential, user.uid);
    }
  }, [user, activeCredential, activeCredentialId]);

  // Verifica suporte WebGPU ao montar
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const service = await import('@/services/webllm-service');
        serviceRef.current = service;
        const supported = await service.isWebGPUSupported();
        setState(prev => ({ ...prev, isSupported: supported }));
      } catch {
        setState(prev => ({ ...prev, isSupported: false }));
      }
    };
    checkSupport();
  }, []);

  // Auto-carrega modelo quando WebLLM está ativo
  useEffect(() => {
    const webLLMModel = (activeCredential as any)?.webLLMModel;
    if (isWebLLMActive && webLLMModel && state.isSupported && !state.isReady && !state.isLoading) {
      loadModel(webLLMModel as WebLLMModelId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWebLLMActive, (activeCredential as any)?.webLLMModel, state.isSupported, state.isReady, state.isLoading]);

  // Descarrega quando muda de provider
  useEffect(() => {
    if (!isWebLLMActive && state.isReady) {
      unloadModel();
    }
  }, [isWebLLMActive]);

  const loadModel = useCallback(async (modelId?: WebLLMModelId) => {
    const service = serviceRef.current || await import('@/services/webllm-service');
    serviceRef.current = service;

    const targetModelId = modelId || ((activeCredential as any)?.webLLMModel as WebLLMModelId) || 'Llama-3.2-3B-Instruct-q4f16_1-MLC';

    // Se já está carregado o mesmo modelo
    if (service.isModelLoaded() && service.getCurrentModelId() === targetModelId) {
      setState(prev => ({ ...prev, isReady: true, currentModelId: targetModelId }));
      return;
    }

    // Se está carregando
    if (service.isCurrentlyLoading()) {
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: null,
    }));

    try {
      await service.loadModel(targetModelId, (progress) => {
        setState(prev => ({ ...prev, progress }));
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        isReady: true,
        currentModelId: targetModelId,
        error: null,
      }));

      toast({
        title: 'Modelo WebLLM carregado',
        description: `${targetModelId} está pronto para uso.`,
      });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Erro ao carregar modelo';
      setState(prev => ({
        ...prev,
        isLoading: false,
        isReady: false,
        error: errorMsg,
      }));

      toast({
        title: 'Erro ao carregar WebLLM',
        description: errorMsg,
        variant: 'error',
      });
    }
  }, [(activeCredential as any)?.webLLMModel, toast]);

  const unloadModel = useCallback(async () => {
    const service = serviceRef.current || await import('@/services/webllm-service');
    serviceRef.current = service;

    await service.unloadModel();
    setState(prev => ({
      ...prev,
      isReady: false,
      currentModelId: null,
      progress: null,
    }));
  }, []);

  const generateText = useCallback(async (prompt: string, systemPrompt?: string): Promise<string> => {
    const service = serviceRef.current || await import('@/services/webllm-service');
    serviceRef.current = service;

    if (!service.isModelLoaded()) {
      throw new Error('Modelo WebLLM não está carregado.');
    }

    return service.generateText(prompt, systemPrompt);
  }, []);

  const generateTextStream = useCallback(async function* (prompt: string, systemPrompt?: string): AsyncGenerator<string, void, unknown> {
    const service = serviceRef.current || await import('@/services/webllm-service');
    serviceRef.current = service;

    if (!service.isModelLoaded()) {
      throw new Error('Modelo WebLLM não está carregado.');
    }

    yield* service.generateTextStream(prompt, systemPrompt);
  }, []);

  const resetChat = useCallback(async () => {
    const service = serviceRef.current;
    if (service) {
      await service.resetChat();
    }
  }, []);

  return {
    ...state,
    loadModel,
    unloadModel,
    generateText,
    generateTextStream,
    resetChat,
    isWebLLMActive,
  };
}

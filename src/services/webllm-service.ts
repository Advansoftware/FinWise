// src/services/webllm-service.ts
"use client";

/**
 * Serviço para carregar e usar modelos WebLLM no navegador.
 *
 * Observações importantes:
 * - Esta implementação usa `@mlc-ai/web-llm` para execução local de LLMs.
 * - Requisitos: navegador com WebGPU (Chrome 113+, Edge 113+), memória RAM/VRAM
 *   suficiente para o modelo escolhido.
 * - O download inicial do modelo pode demorar alguns minutos dependendo da conexão.
 */

import type { MLCEngine, InitProgressReport, ChatCompletionMessageParam } from "@mlc-ai/web-llm";

export type WebLLMModelId =
  | "Llama-3.2-3B-Instruct-q4f16_1-MLC"
  | "Llama-3.1-8B-Instruct-q4f16_1-MLC"
  | "Qwen2.5-7B-Instruct-q4f16_1-MLC"
  | "Phi-3.5-mini-instruct-q4f16_1-MLC"
  | "gemma-2-2b-it-q4f16_1-MLC";

// Engine singleton
let engine: MLCEngine | null = null;
let currentModelId: WebLLMModelId | null = null;
let isLoading = false;

// Callbacks para progresso
type ProgressCallback = (progress: InitProgressReport) => void;
let progressCallback: ProgressCallback | null = null;

export async function isWebGPUSupported(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  try {
    // @ts-ignore - navigator.gpu pode não estar no tipo
    const gpu = (navigator as any).gpu;
    if (!gpu) return false;
    const adapter = await gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

export function isModelLoaded(): boolean {
  return engine !== null && currentModelId !== null;
}

export function getCurrentModelId(): WebLLMModelId | null {
  return currentModelId;
}

export function isCurrentlyLoading(): boolean {
  return isLoading;
}

/**
 * Define callback para progresso do carregamento
 */
export function setProgressCallback(callback: ProgressCallback | null) {
  progressCallback = callback;
}

/**
 * Carrega um modelo WebLLM. Retorna a engine pronta para uso.
 */
export async function loadModel(
  modelId: WebLLMModelId,
  onProgress?: ProgressCallback
): Promise<MLCEngine> {
  // Se já está o mesmo modelo carregado, retorna
  if (engine && currentModelId === modelId) {
    return engine;
  }

  // Se está carregando, aguarda
  if (isLoading) {
    throw new Error("Já existe um modelo sendo carregado. Aguarde.");
  }

  // Verifica suporte WebGPU
  const hasWebGPU = await isWebGPUSupported();
  if (!hasWebGPU) {
    throw new Error(
      "Seu navegador não suporta WebGPU. Use Chrome 113+ ou Edge 113+ para utilizar WebLLM."
    );
  }

  isLoading = true;

  try {
    // Import dinâmico para não quebrar SSR
    const webllm = await import("@mlc-ai/web-llm");

    // Se tinha outro modelo, descarrega
    if (engine) {
      await engine.unload();
      engine = null;
      currentModelId = null;
    }

    // Cria nova engine
    engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: (progress: InitProgressReport) => {
        console.log(`[WebLLM] ${progress.text}`);
        onProgress?.(progress);
        progressCallback?.(progress);
      },
    });

    currentModelId = modelId;
    return engine;
  } catch (e) {
    console.error("Erro ao carregar modelo WebLLM:", e);
    throw e;
  } finally {
    isLoading = false;
  }
}

/**
 * Descarrega o modelo atual
 */
export async function unloadModel() {
  if (engine) {
    try {
      await engine.unload();
    } catch (e) {
      console.warn("Erro ao descarregar modelo:", e);
    }
    engine = null;
    currentModelId = null;
  }
}

/**
 * Gera texto usando o modelo carregado (chat completion)
 */
export async function generateText(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  if (!engine) {
    throw new Error(
      "Modelo WebLLM não carregado. Chame loadModel() antes de gerar texto."
    );
  }

  const messages: ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: prompt });

  const response = await engine.chat.completions.create({
    messages,
    temperature: 0.7,
    max_tokens: 1024,
  });

  return response.choices[0]?.message?.content || "";
}

/**
 * Gera texto em streaming
 */
export async function* generateTextStream(
  prompt: string,
  systemPrompt?: string
): AsyncGenerator<string, void, unknown> {
  if (!engine) {
    throw new Error(
      "Modelo WebLLM não carregado. Chame loadModel() antes de gerar texto."
    );
  }

  const messages: ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: prompt });

  const asyncChunkGenerator = await engine.chat.completions.create({
    messages,
    temperature: 0.7,
    max_tokens: 1024,
    stream: true,
    stream_options: { include_usage: true },
  });

  for await (const chunk of asyncChunkGenerator) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      yield delta;
    }
  }
}

/**
 * Reseta o chat (limpa histórico de contexto)
 */
export async function resetChat() {
  if (engine) {
    await engine.resetChat();
  }
}

/**
 * Limpa o cache de um modelo específico do navegador
 * O WebLLM armazena modelos no Cache Storage
 */
export async function clearModelCache(modelId?: WebLLMModelId): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    console.warn('Cache API não disponível');
    return false;
  }

  try {
    // Se o modelo está carregado, descarrega primeiro
    if (engine && (!modelId || currentModelId === modelId)) {
      await unloadModel();
    }

    // WebLLM usa cache names baseados no modelo
    const cacheNames = await caches.keys();

    let deletedAny = false;
    for (const cacheName of cacheNames) {
      // WebLLM geralmente usa nomes como "webllm/model" ou contém o nome do modelo
      const isWebLLMCache =
        cacheName.includes('webllm') ||
        cacheName.includes('mlc') ||
        cacheName.includes('wasm') ||
        (modelId && cacheName.toLowerCase().includes(modelId.toLowerCase().split('-')[0]));

      if (isWebLLMCache) {
        const deleted = await caches.delete(cacheName);
        if (deleted) {
          console.log(`[WebLLM] Cache "${cacheName}" removido`);
          deletedAny = true;
        }
      }
    }

    // Também limpa IndexedDB onde WebLLM pode armazenar dados
    if (typeof indexedDB !== 'undefined') {
      const databases = await indexedDB.databases?.() || [];
      for (const db of databases) {
        if (db.name && (
          db.name.includes('webllm') ||
          db.name.includes('mlc') ||
          db.name.includes('tvmjs')
        )) {
          indexedDB.deleteDatabase(db.name);
          console.log(`[WebLLM] IndexedDB "${db.name}" removido`);
          deletedAny = true;
        }
      }
    }

    return deletedAny;
  } catch (error) {
    console.error('Erro ao limpar cache do WebLLM:', error);
    return false;
  }
}

/**
 * Retorna o tamanho estimado do cache de modelos WebLLM
 */
export async function getModelCacheSize(): Promise<{ totalBytes: number; formatted: string }> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return { totalBytes: 0, formatted: '0 B' };
  }

  try {
    let totalBytes = 0;
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      if (cacheName.includes('webllm') || cacheName.includes('mlc') || cacheName.includes('wasm')) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();

        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalBytes += blob.size;
          }
        }
      }
    }

    // Formatar tamanho
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = totalBytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return {
      totalBytes,
      formatted: `${size.toFixed(1)} ${units[unitIndex]}`
    };
  } catch (error) {
    console.error('Erro ao calcular tamanho do cache:', error);
    return { totalBytes: 0, formatted: '0 B' };
  }
}

export default {
  isWebGPUSupported,
  isModelLoaded,
  getCurrentModelId,
  isCurrentlyLoading,
  setProgressCallback,
  loadModel,
  unloadModel,
  generateText,
  generateTextStream,
  resetChat,
  clearModelCache,
  getModelCacheSize,
};

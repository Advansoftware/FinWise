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
};

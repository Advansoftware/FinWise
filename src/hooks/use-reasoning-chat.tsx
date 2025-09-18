// src/hooks/use-reasoning-chat.tsx
'use client';

import { useState, useCallback } from 'react';
import { Message } from '@/ai/ai-types';
import { useToast } from '@/hooks/use-toast';

export interface ReasoningState {
  isReasoning: boolean;
  reasoningText: string;
  finalResponse: string;
}

export function useReasoningChat() {
  const [reasoning, setReasoning] = useState<ReasoningState>({
    isReasoning: false,
    reasoningText: '',
    finalResponse: ''
  });
  const { toast } = useToast();

  const clearReasoning = useCallback(() => {
    setReasoning({
      isReasoning: false,
      reasoningText: '',
      finalResponse: ''
    });
  }, []);

  const startReasoning = useCallback(() => {
    setReasoning({
      isReasoning: true,
      reasoningText: '',
      finalResponse: ''
    });
  }, []);

  const updateReasoningText = useCallback((text: string) => {
    setReasoning(prev => ({
      ...prev,
      reasoningText: prev.reasoningText + text
    }));
  }, []);

  const finishReasoning = useCallback((finalResponse: string) => {
    setReasoning(prev => ({
      ...prev,
      isReasoning: false,
      finalResponse
    }));
  }, []);

  // Detecta se é um modelo que suporta linha de raciocínio
  const isReasoningModel = useCallback((modelName?: string): boolean => {
    if (!modelName) return false;
    
    const reasoningModels = [
      'deepseek-r1',
      'qwen2.5-coder-32b-instruct',
      'llama3.2-vision', 
      // Adicione outros modelos que suportam raciocínio aqui
    ];
    
    return reasoningModels.some(model => 
      modelName.toLowerCase().includes(model.toLowerCase()) ||
      modelName.toLowerCase().includes('reasoning') ||
      modelName.toLowerCase().includes('think')
    );
  }, []);

  const processStreamChunk = useCallback((chunk: string) => {
    try {
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            
            // Detecta marcadores de raciocínio
            if (parsed.response) {
              const text = parsed.response;
              
              // Marca o início do raciocínio
              if (text.includes('<think>') || text.includes('<reasoning>')) {
                startReasoning();
                return;
              }
              
              // Marca o fim do raciocínio
              if (text.includes('</think>') || text.includes('</reasoning>')) {
                return;
              }
              
              // Durante o raciocínio, acumula texto
              if (reasoning.isReasoning) {
                updateReasoningText(text);
              } else {
                // Resposta final
                return text;
              }
            }
          } catch (e) {
            // Ignora erros de parsing
          }
        }
      }
    } catch (error) {
      console.error('Erro ao processar chunk:', error);
    }
  }, [reasoning.isReasoning, startReasoning, updateReasoningText]);

  const streamReasoningResponse = useCallback(async (
    messages: Message[],
    prompt: string,
    userId: string,
    transactions: any[],
    monthlyReports: any[],
    annualReports: any[]
  ): Promise<string> => {
    try {
      const response = await fetch('/api/ai/reasoning-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: messages,
          prompt,
          userId,
          transactions,
          monthlyReports,
          annualReports
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com a IA');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Stream não disponível');
      }

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const processedText = processStreamChunk(chunk);
        
        if (processedText && !reasoning.isReasoning) {
          fullResponse += processedText;
        }
      }

      finishReasoning(fullResponse);
      return fullResponse;

    } catch (error) {
      console.error('Erro no streaming de raciocínio:', error);
      clearReasoning();
      
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar resposta';
      toast({
        title: "Erro no Chat",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    }
  }, [reasoning.isReasoning, processStreamChunk, finishReasoning, clearReasoning, toast]);

  return {
    reasoning,
    isReasoningModel,
    streamReasoningResponse,
    clearReasoning,
    startReasoning,
    updateReasoningText,
    finishReasoning
  };
}
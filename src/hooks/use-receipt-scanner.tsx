// src/hooks/use-receipt-scanner.tsx
"use client";

import { useState, useCallback, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { useTransactions } from "@/hooks/use-transactions";
import { useAISettings } from "@/hooks/use-ai-settings";
import { usePlan } from "@/hooks/use-plan";
import { extractReceiptInfoAction } from "@/services/ai-actions";
import {
  getVisionCapableModels,
  DEFAULT_AI_CREDENTIAL,
} from "@/lib/ai-settings";
import { TransactionCategory } from "@/lib/types";

export interface ExtractedReceiptData {
  isValid: boolean;
  items: Array<{ item: string; amount: number }>;
  totalAmount?: number;
  date?: string;
}

interface UseReceiptScannerReturn {
  // State
  receiptImage: string | null;
  extractedData: ExtractedReceiptData | null;
  isProcessing: boolean;
  isSaving: boolean;
  selectedAI: string;
  canSelectProvider: boolean;
  visionCapableCredentials: ReturnType<typeof getVisionCapableModels>;

  // Actions
  setSelectedAI: (id: string) => void;
  processImage: (imageData: string) => Promise<void>;
  saveTransactions: () => Promise<boolean>;
  reset: () => void;
  setReceiptImage: (image: string | null) => void;
}

export function useReceiptScanner(): UseReceiptScannerReturn {
  const { toast } = useToast();
  const { user } = useAuth();
  const { wallets } = useWallets();
  const { addTransaction } = useTransactions();
  const { displayedCredentials, activeCredentialId } = useAISettings();
  const { isPlus } = usePlan();

  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] =
    useState<ExtractedReceiptData | null>(null);
  const [isProcessing, startProcessing] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const visionCapableCredentials = getVisionCapableModels(displayedCredentials);
  const [selectedAI, setSelectedAI] = useState(
    activeCredentialId || DEFAULT_AI_CREDENTIAL.id
  );
  const canSelectProvider = isPlus;

  const reset = useCallback(() => {
    setReceiptImage(null);
    setExtractedData(null);
    setSelectedAI(activeCredentialId || DEFAULT_AI_CREDENTIAL.id);
  }, [activeCredentialId]);

  const processImage = useCallback(
    async (imageData: string) => {
      if (!user) {
        toast({
          variant: "error",
          title: "Erro",
          description: "Você precisa estar logado.",
        });
        return;
      }

      setReceiptImage(imageData);
      setExtractedData(null);

      startProcessing(async () => {
        try {
          const result = await extractReceiptInfoAction(
            { photoDataUri: imageData },
            user.uid,
            selectedAI
          );
          setExtractedData(result);

          if (!result.isValid) {
            toast({
              variant: "error",
              title: "Nota Inválida",
              description: "A imagem não parece ser uma nota fiscal válida.",
            });
          }
        } catch (error: any) {
          toast({
            variant: "error",
            title: "Erro ao Processar",
            description: error.message || "Erro ao processar imagem.",
          });

          if (!error.message?.includes("limite")) {
            reset();
          }
        }
      });
    },
    [user, selectedAI, toast, reset]
  );

  const saveTransactions = useCallback(async (): Promise<boolean> => {
    if (!extractedData?.items?.length || !user) return false;

    return new Promise((resolve) => {
      startSaving(async () => {
        try {
          await Promise.all(
            extractedData.items.map((item) =>
              addTransaction({
                item: item.item,
                amount: parseFloat(String(item.amount)),
                date: extractedData.date
                  ? new Date(extractedData.date).toISOString()
                  : new Date().toISOString(),
                category: "Supermercado" as TransactionCategory,
                type: "expense",
                walletId: wallets[0]?.id || "",
                quantity: 1,
                establishment: "",
                subcategory: "",
              })
            )
          );

          toast({
            title: "Sucesso!",
            description: `${extractedData.items.length} transações salvas.`,
          });
          resolve(true);
        } catch {
          toast({
            variant: "error",
            title: "Erro",
            description: "Não foi possível salvar as transações.",
          });
          resolve(false);
        }
      });
    });
  }, [extractedData, user, wallets, addTransaction, toast]);

  return {
    receiptImage,
    extractedData,
    isProcessing,
    isSaving,
    selectedAI,
    canSelectProvider,
    visionCapableCredentials,
    setSelectedAI,
    processImage,
    saveTransactions,
    reset,
    setReceiptImage,
  };
}

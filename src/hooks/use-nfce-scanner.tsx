// src/hooks/use-nfce-scanner.tsx
"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { useTransactions } from "@/hooks/use-transactions";
import {
  extractNFCeData,
  NFCeExtractionResult,
  NFCeItem,
} from "@/services/nfce-service";
import { convertDateToISO } from "@/lib/nfce-utils";
import { TransactionCategory } from "@/lib/types";

// Formulário editável para cada item (casa com Transaction)
export interface NFCeItemForm {
  item: string; // Transaction.item
  amount: number; // Transaction.amount
  quantity: number; // Transaction.quantity
  selected: boolean; // UI: se está selecionado para salvar
  category: TransactionCategory; // Transaction.category
  subcategory: string; // Transaction.subcategory
}

// Formulário geral da nota
export interface NFCeForm {
  establishment: string; // Transaction.establishment
  category: TransactionCategory; // Categoria padrão
  subcategory: string;
  walletId: string; // Transaction.walletId
  date: string; // ISO date -> Transaction.date
  type: "income" | "expense"; // Transaction.type
  items: NFCeItemForm[];
  totalAmount: number;
}

interface UseNFCeScannerReturn {
  // State
  qrcodeUrl: string | null;
  extractedData: NFCeExtractionResult | null;
  form: NFCeForm | null;
  isProcessing: boolean;
  isSaving: boolean;
  error: string | null;

  // Data helpers
  wallets: ReturnType<typeof useWallets>["wallets"];
  categories: ReturnType<typeof useTransactions>["categories"];
  subcategories: ReturnType<typeof useTransactions>["subcategories"];

  // Actions
  processQRCode: (url: string) => Promise<void>;
  saveTransactions: () => Promise<boolean>;
  reset: () => void;
  updateForm: (updates: Partial<NFCeForm>) => void;
  updateItem: (index: number, updates: Partial<NFCeItemForm>) => void;
  toggleItemSelection: (index: number) => void;
  selectAllItems: (selected: boolean) => void;
}

export function useNFCeScanner(): UseNFCeScannerReturn {
  const { toast } = useToast();
  const { user } = useAuth();
  const { wallets } = useWallets();
  const { addTransaction, addGroupedTransaction, categories, subcategories } =
    useTransactions();

  const [qrcodeUrl, setQrcodeUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] =
    useState<NFCeExtractionResult | null>(null);
  const [form, setForm] = useState<NFCeForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, startProcessing] = useTransition();
  const [isSaving, startSaving] = useTransition();

  // Quando extractedData mudar, inicializa o formulário
  useEffect(() => {
    if (extractedData && extractedData.success) {
      const defaultWalletId = wallets[0]?.id || "";

      setForm({
        establishment: extractedData.establishment,
        category: extractedData.suggestedCategory,
        subcategory: "",
        walletId: defaultWalletId,
        date: convertDateToISO(extractedData.date),
        type: "expense",
        totalAmount: extractedData.totalAmount,
        items: extractedData.items.map((item: NFCeItem) => ({
          item: item.item,
          amount: item.amount,
          quantity: item.quantity,
          selected: true,
          category: item.category,
          subcategory: "", // Subcategoria começa vazia, usuário pode definir
        })),
      });
    }
  }, [extractedData, wallets]);

  const reset = useCallback(() => {
    setQrcodeUrl(null);
    setExtractedData(null);
    setForm(null);
    setError(null);
  }, []);

  const processQRCode = useCallback(
    async (url: string) => {
      if (!user) {
        toast({
          variant: "error",
          title: "Erro",
          description: "Você precisa estar logado.",
        });
        return;
      }

      setQrcodeUrl(url);
      setExtractedData(null);
      setForm(null);
      setError(null);

      startProcessing(async () => {
        try {
          toast({
            title: "QR Code Detectado!",
            description: "Acessando portal da NFCe...",
          });

          // Passa as categorias do usuário para sugestão inteligente
          const result = await extractNFCeData(url, categories);

          if (!result.success) {
            setError(
              result.error || "Não foi possível extrair os dados da nota fiscal"
            );
            toast({
              variant: "error",
              title: "Erro ao Processar",
              description:
                result.error ||
                "Não foi possível acessar os dados da nota fiscal.",
            });
            return;
          }

          setExtractedData(result);

          toast({
            title: "Sucesso!",
            description: `${result.items.length} itens encontrados de "${result.establishment}"`,
          });
        } catch (err: any) {
          const errorMessage = err.message || "Erro ao processar QR Code";
          setError(errorMessage);
          toast({
            variant: "error",
            title: "Erro ao Processar",
            description: errorMessage,
          });
        }
      });
    },
    [user, toast, categories]
  );

  const updateForm = useCallback((updates: Partial<NFCeForm>) => {
    setForm((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const updateItem = useCallback(
    (index: number, updates: Partial<NFCeItemForm>) => {
      setForm((prev) => {
        if (!prev) return null;
        const newItems = [...prev.items];
        newItems[index] = { ...newItems[index], ...updates };
        return { ...prev, items: newItems };
      });
    },
    []
  );

  const toggleItemSelection = useCallback((index: number) => {
    setForm((prev) => {
      if (!prev) return null;
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        selected: !newItems[index].selected,
      };
      return { ...prev, items: newItems };
    });
  }, []);

  const selectAllItems = useCallback((selected: boolean) => {
    setForm((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map((item) => ({ ...item, selected })),
      };
    });
  }, []);

  const saveTransactions = useCallback(async (): Promise<boolean> => {
    if (!form || !user) return false;

    const selectedItems = form.items.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      toast({
        variant: "error",
        title: "Nenhum item selecionado",
        description: "Selecione pelo menos um item para salvar.",
      });
      return false;
    }

    if (!form.walletId) {
      toast({
        variant: "error",
        title: "Carteira não selecionada",
        description: "Selecione uma carteira para salvar as transações.",
      });
      return false;
    }

    return new Promise((resolve) => {
      startSaving(async () => {
        try {
          const transactionDate = new Date(form.date).toISOString();

          // Se tiver mais de 1 item, criar como transação agrupada
          if (selectedItems.length > 1) {
            const groupName =
              form.establishment ||
              `Compra ${new Date(form.date).toLocaleDateString("pt-BR")}`;

            // Transação pai
            const parentTransaction = {
              item: groupName,
              amount: 0, // Será calculado automaticamente
              date: transactionDate,
              category: form.category,
              subcategory: form.subcategory,
              type: form.type,
              walletId: form.walletId,
              establishment: form.establishment,
              groupName,
            };

            // Transações filhas
            const childTransactions = selectedItems.map((item) => ({
              item: item.item,
              amount: parseFloat(String(item.amount)),
              date: transactionDate,
              category: item.category || form.category,
              subcategory: item.subcategory || form.subcategory,
              type: form.type,
              walletId: form.walletId,
              quantity: item.quantity,
              establishment: form.establishment,
            }));

            await addGroupedTransaction(parentTransaction, childTransactions);
          } else {
            // Se for apenas 1 item, criar transação simples
            const item = selectedItems[0];
            await addTransaction({
              item: item.item,
              amount: parseFloat(String(item.amount)),
              date: transactionDate,
              category: item.category || form.category,
              subcategory: item.subcategory || form.subcategory,
              type: form.type,
              walletId: form.walletId,
              quantity: item.quantity,
              establishment: form.establishment,
            });
          }

          toast({
            title: "Sucesso!",
            description: `${selectedItems.length} transação(ões) de "${form.establishment}" salva(s).`,
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
  }, [form, user, addTransaction, addGroupedTransaction, toast]);

  return {
    qrcodeUrl,
    extractedData,
    form,
    isProcessing,
    isSaving,
    error,
    wallets,
    categories,
    subcategories,
    processQRCode,
    saveTransactions,
    reset,
    updateForm,
    updateItem,
    toggleItemSelection,
    selectAllItems,
  };
}

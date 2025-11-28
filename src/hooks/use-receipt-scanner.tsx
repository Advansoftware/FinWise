// src/hooks/use-receipt-scanner.tsx
"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
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
  establishment?: string;
  suggestedCategory?: string;
  items: Array<{ item: string; amount: number }>;
  totalAmount?: number;
  date?: string;
}

// Formulário editável para cada item da nota
export interface ReceiptItemForm {
  item: string;
  amount: number;
  quantity: number;
  selected: boolean; // Se o item será salvo ou não
  category?: TransactionCategory; // Categoria específica do item
  subcategory?: string; // Subcategoria específica do item
}

// Formulário geral da nota
export interface ReceiptForm {
  establishment: string;
  category: TransactionCategory;
  subcategory: string;
  walletId: string;
  date: string;
  type: "income" | "expense";
  items: ReceiptItemForm[];
}

interface UseReceiptScannerReturn {
  // State
  receiptImage: string | null;
  extractedData: ExtractedReceiptData | null;
  form: ReceiptForm | null;
  isProcessing: boolean;
  isSaving: boolean;
  selectedAI: string;
  canSelectProvider: boolean;
  visionCapableCredentials: ReturnType<typeof getVisionCapableModels>;

  // Data helpers
  wallets: ReturnType<typeof useWallets>["wallets"];
  categories: ReturnType<typeof useTransactions>["categories"];
  subcategories: ReturnType<typeof useTransactions>["subcategories"];

  // Actions
  setSelectedAI: (id: string) => void;
  processImage: (imageData: string) => Promise<void>;
  saveTransactions: () => Promise<boolean>;
  reset: () => void;
  setReceiptImage: (image: string | null) => void;
  updateForm: (updates: Partial<ReceiptForm>) => void;
  updateItem: (index: number, updates: Partial<ReceiptItemForm>) => void;
  toggleItemSelection: (index: number) => void;
  selectAllItems: (selected: boolean) => void;
}

export function useReceiptScanner(): UseReceiptScannerReturn {
  const { toast } = useToast();
  const { user } = useAuth();
  const { wallets } = useWallets();
  const { addTransaction, addGroupedTransaction, categories, subcategories } =
    useTransactions();
  const { displayedCredentials, activeCredentialId } = useAISettings();
  const { isPlus } = usePlan();

  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] =
    useState<ExtractedReceiptData | null>(null);
  const [form, setForm] = useState<ReceiptForm | null>(null);
  const [isProcessing, startProcessing] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const visionCapableCredentials = getVisionCapableModels(displayedCredentials);
  const [selectedAI, setSelectedAI] = useState(
    activeCredentialId || DEFAULT_AI_CREDENTIAL.id
  );
  const canSelectProvider = isPlus;

  // Quando extractedData mudar, inicializa o formulário
  useEffect(() => {
    if (extractedData && extractedData.isValid) {
      const defaultWalletId = wallets[0]?.id || "";

      // Validar se a categoria sugerida existe nas categorias do usuário
      let suggestedCategory: TransactionCategory = "Outros";
      if (extractedData.suggestedCategory) {
        const normalizedSuggestion = extractedData.suggestedCategory
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        // Procurar correspondência nas categorias do usuário
        const matchedCategory = categories.find((cat) => {
          const normalizedCat = cat
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          return (
            normalizedCat === normalizedSuggestion ||
            normalizedCat.includes(normalizedSuggestion) ||
            normalizedSuggestion.includes(normalizedCat)
          );
        });

        suggestedCategory =
          matchedCategory ||
          categories.find((c) => c.toLowerCase() === "outros") ||
          categories[0] ||
          "Outros";
      }

      setForm({
        establishment: extractedData.establishment || "",
        category: suggestedCategory,
        subcategory: "",
        walletId: defaultWalletId,
        date: extractedData.date || new Date().toISOString().split("T")[0],
        type: "expense",
        items: extractedData.items.map((item) => ({
          item: item.item,
          amount: item.amount,
          quantity: 1,
          selected: true,
          category: suggestedCategory, // Herda categoria sugerida
          subcategory: "", // Subcategoria começa vazia
        })),
      });
    }
  }, [extractedData, wallets, categories]);

  const reset = useCallback(() => {
    setReceiptImage(null);
    setExtractedData(null);
    setForm(null);
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
      setForm(null);

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

  const updateForm = useCallback((updates: Partial<ReceiptForm>) => {
    setForm((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const updateItem = useCallback(
    (index: number, updates: Partial<ReceiptItemForm>) => {
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
              amount: 0, // Será calculado automaticamente pela soma dos filhos
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
            description: `${selectedItems.length} transação(ões) de "${
              form.establishment || "Nota"
            }" salva(s).`,
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
    receiptImage,
    extractedData,
    form,
    isProcessing,
    isSaving,
    selectedAI,
    canSelectProvider,
    visionCapableCredentials,
    wallets,
    categories,
    subcategories,
    setSelectedAI,
    processImage,
    saveTransactions,
    reset,
    setReceiptImage,
    updateForm,
    updateItem,
    toggleItemSelection,
    selectAllItems,
  };
}

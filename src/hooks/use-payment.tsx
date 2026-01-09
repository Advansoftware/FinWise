// src/hooks/use-payment.tsx
"use client";

import { useState, useCallback } from "react";
import { paymentClient } from "@/lib/payment-client";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { UserPlan } from "@/lib/types";
import { SubscriptionDetails } from "@/core/ports/payment.port";

export function usePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(
    null
  );
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createCheckoutSession = async (plan: Exclude<UserPlan, "Básico">) => {
    if (!user || !user.email) {
      throw new Error("User not authenticated");
    }

    setIsProcessing(true);
    try {
      const result = await paymentClient.createCheckoutSession({
        userId: user.uid,
        userEmail: user.email,
        plan: plan,
      });

      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error(result.error || "Failed to create checkout session");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        variant: "error",
        title: "Erro no Checkout",
        description:
          error.message ||
          "Não foi possível redirecionar para a página de pagamento. Tente novamente mais tarde.",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    setIsProcessing(true);
    try {
      const result = await paymentClient.createPortalSession({
        userId: user.uid,
      });

      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error(result.error || "Failed to open customer portal");
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast({
        variant: "error",
        title: "Erro",
        description:
          error.message ||
          "Não foi possível abrir o portal de gerenciamento. Tente novamente mais tarde.",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      return null;
    }

    setIsLoadingSubscription(true);
    try {
      const result = await paymentClient.getSubscription(user.uid);
      setSubscription(result.subscription);
      return result.subscription;
    } catch (error: any) {
      console.error("Error fetching subscription:", error);
      return null;
    } finally {
      setIsLoadingSubscription(false);
    }
  }, [user]);

  const cancelSubscription = async (immediate: boolean = false) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    setIsProcessing(true);
    try {
      const result = await paymentClient.cancelSubscription({
        userId: user.uid,
        immediate,
      });

      if (result.success) {
        toast({
          title: immediate ? "Assinatura cancelada" : "Cancelamento agendado",
          description: immediate
            ? "Sua assinatura foi cancelada imediatamente."
            : `Sua assinatura será cancelada em ${
                result.cancelAt
                  ? new Date(result.cancelAt).toLocaleDateString("pt-BR")
                  : "breve"
              }.`,
        });
        await fetchSubscription();
        return result;
      } else {
        throw new Error(result.error || "Failed to cancel subscription");
      }
    } catch (error: any) {
      console.error("Cancel error:", error);
      toast({
        variant: "error",
        title: "Erro",
        description:
          error.message ||
          "Não foi possível cancelar a assinatura. Tente novamente mais tarde.",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const reactivateSubscription = async () => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    setIsProcessing(true);
    try {
      const result = await paymentClient.reactivateSubscription({
        userId: user.uid,
      });

      if (result.success) {
        toast({
          title: "Assinatura reativada",
          description: "Sua assinatura foi reativada com sucesso!",
        });
        await fetchSubscription();
        return result;
      } else {
        throw new Error(result.error || "Failed to reactivate subscription");
      }
    } catch (error: any) {
      console.error("Reactivate error:", error);
      toast({
        variant: "error",
        title: "Erro",
        description:
          error.message ||
          "Não foi possível reativar a assinatura. Tente novamente mais tarde.",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    isLoadingSubscription,
    subscription,
    createCheckoutSession,
    openCustomerPortal,
    fetchSubscription,
    cancelSubscription,
    reactivateSubscription,
  };
}

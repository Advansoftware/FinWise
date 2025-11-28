// src/services/credits-service.ts
'use server';

import {getDatabaseAdapter} from '@/core/services/service-factory';
import { AICreditLogAction } from "@/ai/ai-types";

export interface CreditCheckResult {
  success: boolean;
  message?: string;
  userCredits?: number;
  requiredCredits?: number;
}

/**
 * Checks if user has sufficient credits without consuming them
 */
export async function checkAICredits(userId: string, cost: number, action: AICreditLogAction, isFreeAction: boolean = false): Promise<CreditCheckResult> {
  if (!userId) {
    return { success: false, message: "Usuário não autenticado." };
  }

  if (isFreeAction || cost === 0) {
    return { success: true };
  }

  const db = await getDatabaseAdapter();

  // Get user data
  const user = await db.users.findById(userId);

  if (!user) {
    return { success: false, message: "Usuário não encontrado." };
  }

  if (user.plan === 'Básico') {
    return { success: false, message: "Este recurso está disponível apenas para assinantes dos planos Pro, Plus ou Infinity. Faça upgrade para continuar." };
  }

  if (user.aiCredits < cost) {
    return {
      success: false,
      message: `Você precisa de ${cost} créditos, mas tem apenas ${user.aiCredits}. Considere comprar mais créditos ou aguardar a renovação mensal.`,
      userCredits: user.aiCredits,
      requiredCredits: cost
    };
  }

  return { success: true, userCredits: user.aiCredits, requiredCredits: cost };
}

/**
 * Consumes AI credits for a user. This is a server-side action.
 * It checks the user's plan and current credit balance before deducting credits.
 * It also logs the credit usage.
 */
export async function consumeAICredits(userId: string, cost: number, action: AICreditLogAction, isFreeAction: boolean = false): Promise<void> {
  const creditCheck = await checkAICredits(userId, cost, action, isFreeAction);

  if (!creditCheck.success) {
    throw new Error(creditCheck.message);
  }

  if (isFreeAction || cost === 0) {
    return;
  }

  const db = await getDatabaseAdapter();

  // Use transaction to ensure consistency
  await db.withTransaction(async () => {
    // Deduct credits
    await db.users.updateCredits(userId, -cost);

    // Log the credit usage
    await db.aiCreditLogs.create({
      userId: userId,
      action,
      cost,
      timestamp: new Date().toISOString(),
    });
  });
}

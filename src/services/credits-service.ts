// src/services/credits-service.ts
'use server';

import { getDatabaseAdapter } from '@/core/services/service-factory';
import { AICreditLogAction } from "@/ai/ai-types";

/**
 * Consumes AI credits for a user. This is a server-side action.
 * It checks the user's plan and current credit balance before deducting credits.
 * It also logs the credit usage.
 */
export async function consumeAICredits(userId: string, cost: number, action: AICreditLogAction, isFreeAction: boolean = false): Promise<void> {
  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }

  if (isFreeAction || cost === 0) {
    return;
  }

  const db = await getDatabaseAdapter();

  // Get user data
  const user = await db.users.findById(userId);

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  if (user.plan === 'Básico') {
    throw new Error("Este recurso está disponível apenas para assinantes dos planos Pro, Plus ou Infinity. Faça upgrade para continuar.");
  }

  if (user.aiCredits < cost) {
    throw new Error(`Créditos de IA insuficientes. Você precisa de ${cost} créditos, mas tem apenas ${user.aiCredits}. Considere comprar mais créditos ou aguardar a renovação mensal.`);
  }

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

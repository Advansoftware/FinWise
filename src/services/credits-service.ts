// src/services/credits-service.ts
'use server';

import { getAdminApp } from "@/lib/firebase-admin";
import { increment } from "firebase-admin/firestore";
import { AICreditLogAction } from "@/ai/ai-types";

// This service remains using firebase-admin as it deals with sensitive credit data
// and should always be a trusted server-side operation.

export async function consumeAICredits(userId: string, cost: number, action: AICreditLogAction, isFreeAction: boolean = false): Promise<void> {
  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }

  if (isFreeAction || cost === 0) {
    return;
  }

  const adminDb = getAdminApp().firestore();
  const userRef = adminDb.doc(`users/${userId}`);

  try {
    await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error("Usuário não encontrado.");
      }

      const userData = userDoc.data();
      const currentPlan = userData?.plan || 'Básico';
      const currentCredits = userData?.aiCredits || 0;

      if (currentPlan === 'Básico') {
        throw new Error("Este recurso está disponível apenas para assinantes dos planos Pro, Plus ou Infinity. Faça upgrade para continuar.");
      }

      if (currentCredits < cost) {
        throw new Error(`Créditos de IA insuficientes. Você precisa de ${cost} créditos, mas tem apenas ${currentCredits}. Considere comprar mais créditos ou aguardar a renovação mensal.`);
      }

      transaction.update(userRef, { aiCredits: increment(-cost) });

      const logRef = adminDb.collection('users').doc(userId).collection('aiCreditLogs').doc();
      transaction.set(logRef, {
        action,
        cost,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    // Re-throw the original error to be displayed to the user
    throw error;
  }
}

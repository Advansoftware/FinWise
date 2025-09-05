// src/services/credits-service.ts
'use server';

import { getAdminApp } from "@/lib/firebase-admin";
import { AICreditLogAction } from "@/ai/ai-types";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { FieldValue } from "firebase-admin/firestore";

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

  const authProvider = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'firebase';

  if (authProvider === 'mongodb') {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const logsCollection = db.collection('aiCreditLogs');
    const userObjectId = new ObjectId(userId);

    const user = await usersCollection.findOne({ _id: userObjectId });

    if (!user) {
      throw new Error("Usuário não encontrado.");
    }

    if (user.plan === 'Básico') {
      throw new Error("Este recurso está disponível apenas para assinantes dos planos Pro, Plus ou Infinity. Faça upgrade para continuar.");
    }

    if (user.aiCredits < cost) {
      throw new Error(`Créditos de IA insuficientes. Você precisa de ${cost} créditos, mas tem apenas ${user.aiCredits}. Considere comprar mais créditos ou aguardar a renovação mensal.`);
    }

    // Perform the update and log insertion
    await usersCollection.updateOne({ _id: userObjectId }, { $inc: { aiCredits: -cost } });
    await logsCollection.insertOne({
      userId: userId,
      action,
      cost,
      timestamp: new Date().toISOString(),
    });

  } else {
    // Firebase implementation
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

        transaction.update(userRef, { aiCredits: FieldValue.increment(-cost) });

        const logRef = adminDb.collection('users').doc(userId).collection('aiCreditLogs').doc();
        transaction.set(logRef, {
          action,
          cost,
          timestamp: new Date().toISOString(),
        });
      });
    } catch (error) {
      throw error;
    }
  }
}

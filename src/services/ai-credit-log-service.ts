
'use server';

import { getAdminApp } from "@/lib/firebase-admin";
import { AICreditLogAction } from "@/ai/ai-types";

/**
 * Logs the usage of an AI feature to Firestore for a specific user.
 * This is intended to be called from within other server actions.
 * @param userId - The ID of the user performing the action.
 * @param action - The type of AI action performed.
 * @param cost - The number of credits consumed by the action.
 */
export async function logAICreditUsage(
  userId: string,
  action: AICreditLogAction,
  cost: number
): Promise<void> {
  if (!userId) {
    console.error("Attempted to log AI credit usage without a user ID.");
    return;
  }
  if (cost <= 0) return; // Don't log actions that don't cost anything

  try {
    const adminDb = getAdminApp().firestore();
    const logRef = adminDb.collection('users').doc(userId).collection('aiCreditLogs').doc();
    
    await logRef.set({
      action,
      cost,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Failed to log AI credit usage for user ${userId}:`, error);
    // We don't throw an error here because failing to log shouldn't prevent
    // the primary action from completing. This is a non-critical operation.
  }
}

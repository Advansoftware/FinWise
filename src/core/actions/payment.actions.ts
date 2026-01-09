// src/core/actions/payment.actions.ts
'use server';

import { getPaymentService } from '@/core/services/service-factory';
import {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionOutput,
  CreatePortalSessionInput,
  CreatePortalSessionOutput,
  GetSubscriptionOutput,
  CancelSubscriptionInput,
  CancelSubscriptionOutput,
  ReactivateSubscriptionInput,
  ReactivateSubscriptionOutput
} from '@/core/ports/payment.port';

export async function createCheckoutSessionAction(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput> {
  const paymentService = await getPaymentService();
  return paymentService.createCheckoutSession(input);
}

export async function createPortalSessionAction(input: CreatePortalSessionInput): Promise<CreatePortalSessionOutput> {
  const paymentService = await getPaymentService();
  return paymentService.createPortalSession(input);
}

export async function getSubscriptionAction(userId: string): Promise<GetSubscriptionOutput> {
  const paymentService = await getPaymentService();
  return paymentService.getSubscription(userId);
}

export async function cancelSubscriptionAction(input: CancelSubscriptionInput): Promise<CancelSubscriptionOutput> {
  const paymentService = await getPaymentService();
  return paymentService.cancelSubscription(input);
}

export async function reactivateSubscriptionAction(input: ReactivateSubscriptionInput): Promise<ReactivateSubscriptionOutput> {
  const paymentService = await getPaymentService();
  return paymentService.reactivateSubscription(input);
}

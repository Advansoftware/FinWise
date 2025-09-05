// src/core/actions/payment.actions.ts
'use server';

import { getPaymentService } from '@/core/services/service-factory';
import {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionOutput,
  CreatePortalSessionInput,
  CreatePortalSessionOutput
} from '@/core/ports/payment.port';

export async function createCheckoutSessionAction(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput> {
  const paymentService = await getPaymentService();
  return paymentService.createCheckoutSession(input);
}

export async function createPortalSessionAction(input: CreatePortalSessionInput): Promise<CreatePortalSessionOutput> {
  const paymentService = await getPaymentService();
  return paymentService.createPortalSession(input);
}

// src/core/ports/payment.port.ts

import { UserPlan } from '@/lib/types';

export interface CreateCheckoutSessionInput {
  userId: string;
  userEmail: string;
  plan: Exclude<UserPlan, 'Básico'>;
}

export interface CreateCheckoutSessionOutput {
  url: string | null;
  error?: string;
}

export interface CreatePortalSessionInput {
  userId: string;
}

export interface CreatePortalSessionOutput {
  url: string | null;
  error?: string;
}

export interface WebhookEvent {
  type: string;
  data: any;
  signature: string;
  rawBody: string;
}

export interface SubscriptionData {
  subscriptionId: string;
  customerId: string;
  userId: string;
  plan: UserPlan;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

// Main payment service interface (The "Port")
export interface IPaymentService {
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput>;
  createPortalSession(input: CreatePortalSessionInput): Promise<CreatePortalSessionOutput>;
  processWebhook(event: WebhookEvent): Promise<void>;
  validateWebhookSignature(signature: string, rawBody: string): boolean;
}

// Payment repository for managing payment-related data
export interface IPaymentRepository {
  updateUserSubscription(userId: string, subscriptionData: Partial<SubscriptionData>): Promise<void>;
  getUserByStripeCustomerId(customerId: string): Promise<{ uid: string; stripeCustomerId: string } | null>;
  getUserByUserId(userId: string): Promise<{ uid: string; stripeCustomerId?: string } | null>;
  updateUserPlan(userId: string, plan: UserPlan, credits: number): Promise<void>;
}

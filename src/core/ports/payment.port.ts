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

export interface SubscriptionDetails {
  id: string;
  status: string;
  plan: UserPlan;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelAt: Date | null;
  priceAmount: number;
  currency: string;
  interval: string;
  nextInvoiceDate: Date | null;
  paymentMethod?: {
    type: string;
    last4?: string;
    brand?: string;
    expMonth?: number;
    expYear?: number;
  };
}

export interface GetSubscriptionOutput {
  subscription: SubscriptionDetails | null;
  error?: string;
}

export interface CancelSubscriptionInput {
  userId: string;
  immediate?: boolean; // Se true, cancela imediatamente. Se false, cancela no fim do período
}

export interface CancelSubscriptionOutput {
  success: boolean;
  cancelAt?: Date;
  error?: string;
}

export interface ReactivateSubscriptionInput {
  userId: string;
}

export interface ReactivateSubscriptionOutput {
  success: boolean;
  error?: string;
}

export interface UpdateSubscriptionPlanInput {
  userId: string;
  newPlan: Exclude<UserPlan, 'Básico'>;
}

export interface UpdateSubscriptionPlanOutput {
  success: boolean;
  subscription?: SubscriptionDetails;
  error?: string;
}

// Main payment service interface (The "Port")
export interface IPaymentService {
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput>;
  createPortalSession(input: CreatePortalSessionInput): Promise<CreatePortalSessionOutput>;
  processWebhook(event: WebhookEvent): Promise<void>;
  validateWebhookSignature(signature: string, rawBody: string): boolean;
  getSubscription(userId: string): Promise<GetSubscriptionOutput>;
  cancelSubscription(input: CancelSubscriptionInput): Promise<CancelSubscriptionOutput>;
  reactivateSubscription(input: ReactivateSubscriptionInput): Promise<ReactivateSubscriptionOutput>;
  updateSubscriptionPlan(input: UpdateSubscriptionPlanInput): Promise<UpdateSubscriptionPlanOutput>;
}

// Payment repository for managing payment-related data
export interface IPaymentRepository {
  updateUserSubscription(userId: string, subscriptionData: Partial<SubscriptionData>): Promise<void>;
  getUserByStripeCustomerId(customerId: string): Promise<{ uid: string; stripeCustomerId: string } | null>;
  getUserByUserId(userId: string): Promise<{ uid: string; stripeCustomerId?: string } | null>;
  updateUserPlan(userId: string, plan: UserPlan, credits: number): Promise<void>;
  addUserCredits(userId: string, credits: number): Promise<void>;
}

// src/lib/payment-client.ts

import {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionOutput,
  CreatePortalSessionInput,
  CreatePortalSessionOutput,
  GetSubscriptionOutput,
  CancelSubscriptionInput,
  CancelSubscriptionOutput,
  ReactivateSubscriptionInput,
  ReactivateSubscriptionOutput,
  UpdateSubscriptionPlanInput,
  UpdateSubscriptionPlanOutput
} from '@/core/ports/payment.port';

export class PaymentClient {
  private baseUrl = '/api/payments';

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput> {
    const response = await fetch(`${this.baseUrl}?action=createCheckoutSession`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    return response.json();
  }

  async createPortalSession(input: CreatePortalSessionInput): Promise<CreatePortalSessionOutput> {
    const response = await fetch(`${this.baseUrl}?action=createPortalSession`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create portal session');
    }

    return response.json();
  }

  async getSubscription(userId: string): Promise<GetSubscriptionOutput> {
    const response = await fetch(`${this.baseUrl}?action=getSubscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get subscription');
    }

    return response.json();
  }

  async cancelSubscription(input: CancelSubscriptionInput): Promise<CancelSubscriptionOutput> {
    const response = await fetch(`${this.baseUrl}?action=cancelSubscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel subscription');
    }

    return response.json();
  }

  async reactivateSubscription(input: ReactivateSubscriptionInput): Promise<ReactivateSubscriptionOutput> {
    const response = await fetch(`${this.baseUrl}?action=reactivateSubscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reactivate subscription');
    }

    return response.json();
  }

  async updateSubscriptionPlan(input: UpdateSubscriptionPlanInput): Promise<UpdateSubscriptionPlanOutput> {
    const response = await fetch(`${this.baseUrl}?action=updateSubscriptionPlan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update subscription plan');
    }

    return response.json();
  }
}

export const paymentClient = new PaymentClient();

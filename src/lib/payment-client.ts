// src/lib/payment-client.ts

import {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionOutput,
  CreatePortalSessionInput,
  CreatePortalSessionOutput
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
}

export const paymentClient = new PaymentClient();

// src/services/payment-actions.ts
'use server';

import { getPaymentService, CheckoutInput, PortalInput, CheckoutOutput, PortalOutput } from "./payment-service";

/**
 * Creates a checkout session using the configured payment provider.
 * UI components should call this action.
 */
export async function createCheckoutAction(input: CheckoutInput): Promise<CheckoutOutput> {
    const paymentService = getPaymentService();
    return paymentService.createCheckoutSession(input);
}

/**
 * Creates a customer portal session using the configured payment provider.
 * UI components should call this action.
 */
export async function createPortalAction(input: PortalInput): Promise<PortalOutput> {
    const paymentService = getPaymentService();
    return paymentService.createPortalSession(input);
}

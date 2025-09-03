// src/services/payment-service.ts

import { UserPlan } from "@/lib/types";
import { getStripeAdapter } from "@/adapters/stripe-adapter";

// --- Input/Output Types for the Payment Service ---

export interface CheckoutInput {
    userId: string;
    userEmail: string;
    plan: Exclude<UserPlan, 'Básico'>;
}

export interface CheckoutOutput {
    url: string | null;
    error?: string;
}

export interface PortalInput {
    userId: string;
}

export interface PortalOutput {
    url: string | null;
    error?: string;
}

// --- Payment Service Interface (The "Port") ---

export interface PaymentService {
    createCheckoutSession(input: CheckoutInput): Promise<CheckoutOutput>;
    createPortalSession(input: PortalInput): Promise<PortalOutput>;
}

// --- Service Factory ---

/**
 * Returns the currently configured payment service provider.
 * This acts as a factory, allowing us to easily switch providers in the future.
 */
export function getPaymentService(): PaymentService {
    // For now, we are hardcoding the Stripe adapter.
    // In the future, this could read from a config file to decide which provider to use.
    return getStripeAdapter();
}

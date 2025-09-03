// src/adapters/stripe-adapter.ts

import { PaymentService, CheckoutInput, CheckoutOutput, PortalInput, PortalOutput } from "@/services/payment-service";
import { getAdminApp } from '@/lib/firebase-admin';
import Stripe from 'stripe';
import { UserPlan } from "@/lib/types";

class StripeAdapter implements PaymentService {
    private stripe: Stripe;

    constructor() {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new Error("A chave secreta do Stripe não está configurada no servidor.");
        }
        this.stripe = new Stripe(secretKey, {
            apiVersion: '2024-06-20',
        });
    }

    private getPriceId(plan: Exclude<UserPlan, 'Básico'>): string {
        const priceIdMap = {
            'Pro': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
            'Plus': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS,
            'Infinity': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_INFINITY,
        };
        const priceId = priceIdMap[plan];

        if (!priceId) {
            throw new Error(`O ID de preço para o plano ${plan} não está configurado.`);
        }
        return priceId;
    }

    async createCheckoutSession(input: CheckoutInput): Promise<CheckoutOutput> {
        const { userId, userEmail, plan } = input;
        
        if (!userId || !userEmail) {
            return { url: null, error: "Usuário não autenticado ou email ausente." };
        }

        try {
            const priceId = this.getPriceId(plan);
            const adminDb = getAdminApp().firestore();
            const userDocRef = adminDb.doc(`users/${userId}`);

            const userDoc = await userDocRef.get();
            let stripeCustomerId = userDoc.data()?.stripeCustomerId;

            if (!stripeCustomerId) {
                const customer = await this.stripe.customers.create({
                    email: userEmail,
                    metadata: { firebaseUID: userId },
                });
                stripeCustomerId = customer.id;
                await userDocRef.set({ stripeCustomerId }, { merge: true });
            }

            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'subscription',
                customer: stripeCustomerId,
                line_items: [{
                    price: priceId,
                    quantity: 1,
                }],
                subscription_data: {
                    metadata: {
                        firebaseUID: userId,
                        plan: plan,
                    }
                },
                success_url: `${appUrl}/billing?success=true`,
                cancel_url: `${appUrl}/billing`,
            });

            return { url: session.url };

        } catch (error) {
            console.error("[StripeAdapter] Error creating Checkout session:", error);
            const errorMessage = error instanceof Stripe.errors.StripeError ? error.message : "Não foi possível iniciar o processo de pagamento.";
            return { url: null, error: errorMessage };
        }
    }

    async createPortalSession(input: PortalInput): Promise<PortalOutput> {
        const { userId } = input;
        if (!userId) {
            return { url: null, error: "Usuário não autenticado." };
        }

        try {
            const adminDb = getAdminApp().firestore();
            const userDocRef = adminDb.doc(`users/${userId}`);
            const userDoc = await userDocRef.get();
            const stripeCustomerId = userDoc.data()?.stripeCustomerId;

            if (!stripeCustomerId) {
                return { url: null, error: "Cliente Stripe não encontrado para este usuário." };
            }

            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

            const portalSession = await this.stripe.billingPortal.sessions.create({
                customer: stripeCustomerId,
                return_url: `${appUrl}/billing`,
            });

            return { url: portalSession.url };

        } catch (error) {
            console.error("[StripeAdapter] Error creating Portal session:", error);
            const errorMessage = error instanceof Stripe.errors.StripeError ? error.message : "Não foi possível abrir o portal de gerenciamento.";
            return { url: null, error: errorMessage };
        }
    }
}

// Singleton instance of the adapter
let stripeAdapterInstance: StripeAdapter | null = null;

export function getStripeAdapter(): StripeAdapter {
    if (!stripeAdapterInstance) {
        stripeAdapterInstance = new StripeAdapter();
    }
    return stripeAdapterInstance;
}

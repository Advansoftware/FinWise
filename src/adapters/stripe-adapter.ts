
// src/adapters/stripe-adapter.ts

import { PaymentService, CheckoutInput, CheckoutOutput, PortalInput, PortalOutput } from "@/services/payment-service";
import Stripe from 'stripe';
import { UserPlan } from "@/lib/types";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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
            const { db } = await connectToDatabase();
            const usersCollection = db.collection('users');
            const userObjectId = new ObjectId(userId);
            
            const userDoc = await usersCollection.findOne({ _id: userObjectId });
            let stripeCustomerId = userDoc?.stripeCustomerId;

            // Session configuration object
            const sessionConfig: Stripe.Checkout.SessionCreateParams = {
                payment_method_types: ['card'],
                mode: 'subscription',
                line_items: [{
                    price: priceId,
                    quantity: 1,
                }],
                subscription_data: {
                    metadata: {
                        userId: userId,
                        plan: plan,
                    }
                },
                success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/billing?success=true`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/billing?canceled=true`,
            };

            // If user already has a Stripe Customer ID, use it.
            if (stripeCustomerId) {
                sessionConfig.customer = stripeCustomerId;
            } else {
                // Otherwise, let Stripe create the customer during checkout and we will save it via webhook.
                sessionConfig.customer_email = userEmail;
                // Add metadata to the customer creation as well
                sessionConfig.customer_creation = 'always';
                sessionConfig.metadata = { userId };
            }

            const session = await this.stripe.checkout.sessions.create(sessionConfig);

            // If a new customer was created by Stripe during checkout,
            // we should store this ID now.
            if (session.customer && !stripeCustomerId) {
                 await usersCollection.updateOne(
                    { _id: userObjectId },
                    { $set: { stripeCustomerId: session.customer as string } }
                );
            }
            
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
            const { db } = await connectToDatabase();
            const usersCollection = db.collection('users');
            const userObjectId = new ObjectId(userId);
            
            const userDoc = await usersCollection.findOne({ _id: userObjectId });
            const stripeCustomerId = userDoc?.stripeCustomerId;

            if (!stripeCustomerId) {
                console.error(`[StripeAdapter] Portal session error: No stripeCustomerId found for user ${userId}`);
                return { url: null, error: "Gerenciamento de assinatura indisponível. Por favor, contate o suporte." };
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

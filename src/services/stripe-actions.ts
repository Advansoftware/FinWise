// src/services/stripe-actions.ts
'use server';

import { UserPlan } from '@/lib/types';
import { getAdminApp } from '@/lib/firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

export async function createStripeCheckoutAction(userId: string, userEmail: string, plan: Exclude<UserPlan, 'Básico'>): Promise<{ url: string | null; error?: string }> {
  if (!userId || !userEmail) {
    return { url: null, error: "Usuário não autenticado ou email ausente." };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("A chave secreta do Stripe não está configurada no servidor.");
    return { url: null, error: "Erro de configuração de pagamento no servidor." };
  }
  
  let priceId: string | undefined;

  switch (plan) {
    case 'Pro':
      priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO;
      break;
    case 'Plus':
      priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS;
      break;
    case 'Infinity':
      priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_INFINITY;
      break;
  }

  if (!priceId) {
    console.error(`O ID de preço para o plano ${plan} não está configurado.`);
    return { url: null, error: `Erro de configuração para o plano ${plan}.` };
  }

  const adminDb = getAdminApp().firestore();
  const userDocRef = adminDb.doc(`users/${userId}`);

  try {
    const userDoc = await userDocRef.get();
    let stripeCustomerId = userDoc.data()?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { firebaseUID: userId },
      });
      stripeCustomerId = customer.id;
      await userDocRef.set({ stripeCustomerId }, { merge: true });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    const session = await stripe.checkout.sessions.create({
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
      cancel_url: `${appUrl}/billing?canceled=true`,
    });

    return { url: session.url };
  } catch (error) {
    console.error("Error creating Stripe Checkout session:", error);
    const errorMessage = error instanceof Stripe.errors.StripeError ? error.message : "Não foi possível iniciar o processo de pagamento.";
    return { url: null, error: errorMessage };
  }
}


export async function createStripePortalSession(userId: string): Promise<{ url: string | null, error?: string }> {
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

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/billing`,
    });

    return { url: portalSession.url };

  } catch (error) {
    console.error("Error creating Stripe Portal session:", error);
    const errorMessage = error instanceof Stripe.errors.StripeError ? error.message : "Não foi possível abrir o portal de gerenciamento.";
    return { url: null, error: errorMessage };
  }
}

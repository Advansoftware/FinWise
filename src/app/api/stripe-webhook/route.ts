
// src/app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { getAdminApp } from '@/lib/firebase-admin';
import { UserPlan } from '@/lib/types';
import { firestore } from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

const creditsMap: Record<UserPlan, number> = {
    'Básico': 0,
    'Pro': 100,
    'Plus': 300,
};

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const firebaseUID = session.metadata?.firebaseUID;
    const plan = session.metadata?.plan as UserPlan;

    if (!firebaseUID || !plan) {
        console.error(`Webhook Error: firebaseUID ou plan ausente nos metadados da sessão de checkout: ${session.id}`);
        return;
    }

    const adminDb = getAdminApp().firestore();
    const userRef = adminDb.doc(`users/${firebaseUID}`);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        console.error(`Webhook Error: Usuário com UID ${firebaseUID} não encontrado no Firestore.`);
        return;
    }

    console.log(`Atualizando plano para ${plan} para o usuário ${firebaseUID}...`);
    await userRef.update({
        plan: plan,
        aiCredits: creditsMap[plan], // Reseta/Define os créditos ao assinar
        stripeCustomerId: session.customer, // Salva o ID do cliente do Stripe
    });
    console.log(`Plano do usuário ${firebaseUID} atualizado com sucesso para ${plan}.`);
}


async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    // This event is for renewals.
    // The subscription object in the invoice contains the metadata.
    const subscriptionId = invoice.subscription;
    if (typeof subscriptionId !== 'string') {
        console.log("Invoice without subscription ID, likely not a renewal. Skipping.");
        return;
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const firebaseUID = subscription.metadata.firebaseUID;
    const plan = subscription.metadata.plan as UserPlan;

    if (!firebaseUID || !plan) {
        console.error(`Webhook Renewal Error: firebaseUID ou plan ausente nos metadados da assinatura: ${subscriptionId}`);
        return;
    }

    const adminDb = getAdminApp().firestore();
    const userRef = adminDb.doc(`users/${firebaseUID}`);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
        console.error(`Webhook Renewal Error: Usuário com UID ${firebaseUID} não encontrado no Firestore.`);
        return;
    }

    console.log(`Renovando créditos para o plano ${plan} para o usuário ${firebaseUID}...`);
    await userRef.update({
        aiCredits: creditsMap[plan], // Reseta os créditos no início de cada ciclo de pagamento
    });
    console.log(`Créditos do usuário ${firebaseUID} renovados com sucesso.`);
}


export async function POST(req: NextRequest) {
    const buf = await req.text();
    const sig = headers().get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!sig || !webhookSecret) {
            console.error("Webhook Error: Assinatura do Stripe ou segredo do webhook ausente.");
            return NextResponse.json({ error: 'Segredo do Webhook não configurado.' }, { status: 400 });
        }
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    try {
        switch (event.type) {
             case 'checkout.session.completed':
                const session = event.data.object as Stripe.Checkout.Session;
                // This handles the initial subscription creation
                await handleCheckoutSessionCompleted(session);
                break;
            
             case 'invoice.payment_succeeded':
                // This handles subscription renewals
                const invoice = event.data.object as Stripe.Invoice;
                if (invoice.billing_reason === 'subscription_cycle') {
                   await handleInvoicePaymentSucceeded(invoice);
                }
                break;
            
            // TODO: Handle subscription cancellations
            // case 'customer.subscription.deleted':
            //     // ... logic to downgrade user to Básico plan
            //     break;
            
            default:
                // console.log(`Evento não tratado do tipo ${event.type}`);
        }
    } catch (error) {
        console.error("Erro ao processar o webhook:", error);
        return NextResponse.json({ error: 'Erro interno ao processar webhook.' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}

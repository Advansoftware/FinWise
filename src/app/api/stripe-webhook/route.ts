
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
    
    try {
        await userRef.update({
            plan: plan,
            aiCredits: creditsMap[plan], // Define o valor de créditos para o novo plano
            stripeCustomerId: session.customer, // Salva ou atualiza o ID do cliente do Stripe
        });
        console.log(`Plano do usuário ${firebaseUID} atualizado com sucesso para ${plan}.`);
    } catch (error) {
        console.error(`Falha ao atualizar o plano do usuário ${firebaseUID} para ${plan}:`, error);
        // Opcional: Adicionar lógica de re-tentativa ou notificação de erro
    }
}


async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    // Este evento é útil para renovações.
    const subscriptionId = invoice.subscription;
    if (typeof subscriptionId !== 'string' || invoice.billing_reason !== 'subscription_cycle') {
        // Ignora faturas que não são de renovação de ciclo de assinatura
        return;
    }

    // Precisamos buscar a assinatura para obter os metadados
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const firebaseUID = subscription.metadata.firebaseUID;

    if (!firebaseUID) {
        console.error(`Webhook de Renovação: firebaseUID ausente nos metadados da assinatura: ${subscriptionId}`);
        return;
    }
    
    // Identificar o plano pelo ID do preço
    const priceId = subscription.items.data[0]?.price.id;
    let plan: UserPlan = 'Básico'; // Padrão de segurança
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO) {
        plan = 'Pro';
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS) {
        plan = 'Plus';
    }

    if (plan === 'Básico') {
        console.error(`Webhook de Renovação: ID de preço ${priceId} não corresponde a um plano conhecido.`);
        return;
    }

    const adminDb = getAdminApp().firestore();
    const userRef = adminDb.doc(`users/${firebaseUID}`);
    
    console.log(`Renovando créditos para o plano ${plan} do usuário ${firebaseUID}...`);
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
                // Lida com a criação inicial da assinatura
                await handleCheckoutSessionCompleted(session);
                break;
            
             case 'invoice.payment_succeeded':
                const invoice = event.data.object as Stripe.Invoice;
                // Lida com renovações da assinatura
                await handleInvoicePaymentSucceeded(invoice);
                break;
            
            // TODO: Lidar com cancelamentos de assinatura
            // case 'customer.subscription.deleted':
            //     // ... lógica para fazer o downgrade do plano do usuário para 'Básico'
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

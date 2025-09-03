
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

async function findUserByStripeCustomerId(customerId: string): Promise<{id: string, ref: firestore.DocumentReference} | null> {
    const adminDb = getAdminApp().firestore();
    const usersRef = adminDb.collection('users');
    const q = usersRef.where('stripeCustomerId', '==', customerId).limit(1);
    const snapshot = await q.get();

    if (snapshot.empty) {
        console.warn(`Webhook: Não foi encontrado usuário com stripeCustomerId: ${customerId}`);
        return null;
    }
    const userDoc = snapshot.docs[0];
    return { id: userDoc.id, ref: userDoc.ref };
}

async function findUserByFirebaseUID(firebaseUID: string): Promise<{id: string, ref: firestore.DocumentReference} | null> {
    if (!firebaseUID) return null;
    const adminDb = getAdminApp().firestore();
    const userRef = adminDb.doc(`users/${firebaseUID}`);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        console.warn(`Webhook: Não foi encontrado usuário com firebaseUID: ${firebaseUID}`);
        return null;
    }
    return { id: userDoc.id, ref: userDoc.ref };
}


async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    if (typeof customerId !== 'string' || typeof subscriptionId !== 'string') {
        console.error('Webhook Error: customerId ou subscriptionId ausente no evento de fatura.');
        return;
    }
    
    // Obter os metadados da assinatura para saber o plano e o UID do Firebase
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const firebaseUID = subscription.metadata.firebaseUID;
    
    // Encontrar o usuário no Firestore pelo firebaseUID dos metadados da assinatura
    const user = await findUserByFirebaseUID(firebaseUID);
    if (!user) {
        console.error(`Webhook Error: Usuário com UID ${firebaseUID} não encontrado no Firestore.`);
        return;
    }

    const plan = subscription.metadata.plan as UserPlan;
    if (!plan || !creditsMap[plan]) {
        console.error(`Webhook Error: Plano inválido ou ausente nos metadados da assinatura: ${plan}`);
        return;
    }

    console.log(`Atualizando plano para ${plan} para o usuário ${user.id}...`);
    await user.ref.update({
        plan: plan,
        aiCredits: creditsMap[plan], // Reseta os créditos no início de cada ciclo de pagamento
    });
    console.log(`Plano do usuário ${user.id} atualizado com sucesso para ${plan}.`);
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
             case 'invoice.payment_succeeded':
                const invoice = event.data.object as Stripe.Invoice;
                // O billing_reason 'subscription_cycle' lida com renovações
                // O 'subscription_create' lida com o primeiro pagamento de uma nova assinatura
                if (invoice.billing_reason === 'subscription_create' || invoice.billing_reason === 'subscription_cycle') {
                   await handleInvoicePaymentSucceeded(invoice);
                }
                break;
            
            // Adicionar mais manipuladores de eventos aqui se necessário (ex: cancelamento)
            // case 'customer.subscription.deleted':
            //     // ...
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

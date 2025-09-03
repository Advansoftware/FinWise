
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
    'Infinity': 500,
};

async function sendCommandToClient(userId: string, command: object) {
    const rtdb = getAdminApp().database();
    const commandRef = rtdb.ref(`commands/${userId}`);
    // Using set() will overwrite any existing command, which is fine for this use case
    await commandRef.set(command);
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const subscriptionId = session.subscription;
    if (typeof subscriptionId !== 'string') {
        console.error(`Webhook Error: Subscription ID is not a string. Session ID: ${session.id}`);
        return;
    }

    if (!session.customer) {
        console.error(`Webhook Error: Customer ID is missing from session. Session ID: ${session.id}`);
        return;
    }
    
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        const firebaseUID = subscription.metadata?.firebaseUID;
        const plan = subscription.metadata?.plan as UserPlan;

        if (!firebaseUID || !plan) {
            console.error(`Webhook Error: firebaseUID or plan is missing from subscription metadata. Subscription ID: ${subscriptionId}`);
            return;
        }

        // Send a command to the client to update the user's plan
        await sendCommandToClient(firebaseUID, {
            action: 'SET_USER_PLAN',
            payload: {
                plan: plan,
                aiCredits: creditsMap[plan] || 0,
                stripeCustomerId: session.customer,
                stripeSubscriptionId: subscription.id,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            }
        });
        
        console.log(`[Webhook] Sent SET_USER_PLAN command to user ${firebaseUID} for plan ${plan}.`);

    } catch (error) {
        console.error(`[Webhook] Error handling checkout.session.completed for session ${session.id}:`, error);
    }
}

// NOTE: Invoice payment succeeded is for renewals. Since the client-side database
// doesn't persist between sessions in the same way, we can let the initial `SET_USER_PLAN`
// handle the credit update. For a full production system with a server DB,
// this would be important for credit renewals. For now, we can simplify.

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const firebaseUID = subscription.metadata.firebaseUID;
    if (!firebaseUID) {
        console.error(`[Webhook] Cancellation Error: firebaseUID is missing from subscription metadata. Subscription ID: ${subscription.id}`);
        return;
    }
    
    try {
        // Send a command to the client to downgrade the plan
        await sendCommandToClient(firebaseUID, {
            action: 'DOWNGRADE_USER_PLAN',
            payload: {}
        });

        console.log(`[Webhook] Sent DOWNGRADE_USER_PLAN command to user ${firebaseUID}.`);
    } catch (error) {
        console.error(`[Webhook] Error handling subscription cancellation for user ${firebaseUID}:`, error);
    }
}


export async function POST(req: NextRequest) {
    const buf = await req.text();
    const sig = headers().get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!sig || !webhookSecret) {
            console.error("[Webhook Error] Stripe signature or webhook secret is missing.");
            return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 400 });
        }
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err: any) {
        console.error(`[Webhook Error] Signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    try {
        switch (event.type) {
             case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;
            
            // We are simplifying and not handling 'invoice.payment_succeeded' for now
            // as the client-side DB state would be reset anyway on a new session.
            
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;
            
            default:
                // Unhandled event type
        }
    } catch (error) {
        console.error("[Webhook Error] Error processing webhook:", error);
        return NextResponse.json({ error: 'Internal server error while processing webhook.' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}

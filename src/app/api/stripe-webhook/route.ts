
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

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const subscriptionId = session.subscription;
    if (typeof subscriptionId !== 'string') {
        console.error(`Webhook Error: Subscription ID is not a string. Session ID: ${session.id}`);
        return;
    }

    // Customer ID must exist to link the subscription to a customer
    if (!session.customer) {
        console.error(`Webhook Error: Customer ID is missing from session. Session ID: ${session.id}`);
        return;
    }
    
    try {
        // **ROBUST FIX**: Retrieve the subscription object directly from Stripe.
        // This is the source of truth for metadata.
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        const firebaseUID = subscription.metadata?.firebaseUID;
        const plan = subscription.metadata?.plan as UserPlan;

        if (!firebaseUID || !plan) {
            console.error(`Webhook Error: firebaseUID or plan is missing from subscription metadata. Subscription ID: ${subscriptionId}`);
            return;
        }

        const adminDb = getAdminApp().firestore();
        const userRef = adminDb.doc(`users/${firebaseUID}`);
        
        // This is the crucial update that happens after a successful checkout.
        // It sets the plan, credits, and Stripe-related IDs on the user's document.
        await userRef.set({
            plan: plan,
            aiCredits: creditsMap[plan] || 0,
            stripeCustomerId: session.customer, // Save the customer ID
            stripeSubscriptionId: subscription.id,
            stripeCurrentPeriodEnd: firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
        }, { merge: true }); // Use merge:true to avoid overwriting existing user fields.
        
        console.log(`[Webhook] Successfully set plan for user ${firebaseUID} to ${plan}.`);

    } catch (error) {
        console.error(`[Webhook] Error handling checkout.session.completed for session ${session.id}:`, error);
    }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    // Only handle renewals, not the initial creation payment
    if (invoice.billing_reason !== 'subscription_cycle') {
        return;
    }
    
    const subscriptionId = invoice.subscription;
    if (!subscriptionId || typeof subscriptionId !== 'string') {
        return;
    }
    
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const firebaseUID = subscription.metadata.firebaseUID;
        const plan = subscription.metadata.plan as UserPlan;
        
        if (!firebaseUID || !plan) {
            console.error(`[Webhook] Renewal Error: firebaseUID or plan is missing from subscription metadata. Subscription ID: ${subscriptionId}`);
            return;
        }

        const adminDb = getAdminApp().firestore();
        const userRef = adminDb.doc(`users/${firebaseUID}`);
        
        // This logic is for renewals. It resets the credits to the plan's amount.
        await userRef.update({
            aiCredits: creditsMap[plan], 
            stripeCurrentPeriodEnd: firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
        });

        console.log(`[Webhook] Successfully renewed credits for user ${firebaseUID}.`);
    } catch (error) {
        console.error(`[Webhook] Error handling invoice.payment_succeeded for subscription ${subscriptionId}:`, error);
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const firebaseUID = subscription.metadata.firebaseUID;
    if (!firebaseUID) {
        console.error(`[Webhook] Cancellation Error: firebaseUID is missing from subscription metadata. Subscription ID: ${subscription.id}`);
        return;
    }
    
    try {
        const adminDb = getAdminApp().firestore();
        const userRef = adminDb.doc(`users/${firebaseUID}`);
        
        await userRef.update({
            plan: 'Básico',
            aiCredits: 0,
            stripeSubscriptionId: null, // Clear subscription ID
            stripeCurrentPeriodEnd: null,
        });

        console.log(`[Webhook] Successfully downgraded plan to Básico for user ${firebaseUID}.`);
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
            
             case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;
            
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

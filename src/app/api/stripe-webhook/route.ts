
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
    // If the checkout session is for a subscription...
    if (session.mode === 'subscription' && session.subscription) {
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const firebaseUID = subscription.metadata.firebaseUID;
        const plan = subscription.metadata.plan as UserPlan;
        
        if (!firebaseUID || !plan) {
            console.error(`[Webhook Critical Error] firebaseUID or plan is missing from subscription metadata. Subscription ID: ${subscription.id}`);
            return;
        }

        try {
            const adminDb = getAdminApp().firestore();
            const userRef = adminDb.doc(`users/${firebaseUID}`);

            // Set the Stripe Customer ID on the user's document for future portal access
            // and store the active subscription ID.
            await userRef.set({
                plan: plan,
                aiCredits: creditsMap[plan] || 0,
                stripeCustomerId: subscription.customer as string,
                stripeSubscriptionId: subscription.id,
                stripeCurrentPeriodEnd: firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
            }, { merge: true });
            
            console.log(`[Webhook] Successfully processed subscription ${subscription.id} for user ${firebaseUID} on plan ${plan}.`);

        } catch (error) {
            console.error(`[Webhook] Error handling checkout.session.completed for user ${firebaseUID}:`, error);
        }
    } else {
         console.log(`[Webhook] Skipped processing checkout session ${session.id} as it is not a subscription.`);
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

        // Downgrade the user to the 'Básico' plan and clear Stripe-related fields.
        await userRef.update({
            plan: 'Básico',
            aiCredits: 0,
            stripeSubscriptionId: null,
            stripeCurrentPeriodEnd: null,
            // Optionally, you might want to keep the stripeCustomerId for history
        });

        console.log(`[Webhook] Successfully downgraded plan for user ${firebaseUID} upon subscription cancellation.`);
    } catch (error) {
        console.error(`[Webhook] Error handling subscription cancellation for user ${firebaseUID}:`, error);
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const firebaseUID = subscription.metadata.firebaseUID;
    const newPlan = subscription.metadata.plan as UserPlan;

    if (!firebaseUID || !newPlan) {
        console.error(`[Webhook] Update Error: firebaseUID or plan is missing from subscription metadata. Subscription ID: ${subscription.id}`);
        return;
    }

    // Check if the subscription is still active. If it was cancelled but not yet deleted,
    // the status will be 'active' until the end of the period. A 'canceled' status here
    // means it's effectively over.
    if (subscription.status !== 'active') {
        return handleSubscriptionDeleted(subscription);
    }

    try {
        const adminDb = getAdminApp().firestore();
        const userRef = adminDb.doc(`users/${firebaseUID}`);

        // Update the user's plan and credit-related fields.
        await userRef.update({
            plan: newPlan,
            aiCredits: creditsMap[newPlan] || 0,
            stripeCurrentPeriodEnd: firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
        });

        console.log(`[Webhook] Successfully updated plan for user ${firebaseUID} to ${newPlan}.`);
    } catch (error) {
        console.error(`[Webhook] Error handling subscription update for user ${firebaseUID}:`, error);
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
            
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
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

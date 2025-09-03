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
    // The subscription ID is now found in the metadata passed during session creation.
    const firebaseUID = session.metadata?.firebaseUID;
    const plan = session.metadata?.plan as UserPlan;
    
    if (!session.subscription) {
         console.error(`Webhook Error: Subscription ID is missing. Session ID: ${session.id}`);
         return;
    }

    if (!firebaseUID || !plan) {
        console.error(`Webhook Error: firebaseUID or plan is missing from checkout session metadata. Session ID: ${session.id}`);
        // Attempt to retrieve from the subscription object as a fallback
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        if(!subscription.metadata.firebaseUID) {
            console.error(`Webhook Critical Error: firebaseUID is also missing from subscription metadata. Subscription ID: ${session.subscription}`);
            return;
        }
    }

    try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const adminDb = getAdminApp().firestore();
        const userRef = adminDb.doc(`users/${firebaseUID}`);

        // Set the Stripe Customer ID on the user's document for future portal access.
        // It's crucial to also store the subscription ID to manage its status.
        await userRef.set({
            plan: plan,
            aiCredits: creditsMap[plan] || 0,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: subscription.id,
            stripeCurrentPeriodEnd: firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
        }, { merge: true });
        
        console.log(`[Webhook] Successfully updated plan for user ${firebaseUID} to ${plan}.`);

    } catch (error) {
        console.error(`[Webhook] Error handling checkout.session.completed for session ${session.id}:`, error);
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    // The firebaseUID should have been stored in the subscription's metadata
    // when it was created.
    const firebaseUID = subscription.metadata.firebaseUID;
    if (!firebaseUID) {
        console.error(`[Webhook] Cancellation Error: firebaseUID is missing from subscription metadata. Subscription ID: ${subscription.id}`);
        // As a fallback, we can try to find the user by their Stripe Customer ID.
        // This is less direct and assumes a 1-to-1 mapping.
        const customerId = subscription.customer;
        // const user = await findUserByStripeCustomerId(customerId); // This function would need to be implemented
        // if (!user) return;
        // firebaseUID = user.uid;
        return; // For now, we'll return if the UID isn't in metadata.
    }
    
    try {
        const adminDb = getAdminApp().firestore();
        const userRef = adminDb.doc(`users/${firebaseUID}`);

        // Downgrade the user to the 'Básico' plan and clear Stripe-related fields.
        await userRef.update({
            plan: 'Básico',
            stripeSubscriptionId: null,
            stripeCurrentPeriodEnd: null,
            // Optionally, clear the customer ID if they have no other subscriptions.
            // stripeCustomerId: null, 
        });

        console.log(`[Webhook] Successfully downgraded plan for user ${firebaseUID} upon subscription cancellation.`);
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

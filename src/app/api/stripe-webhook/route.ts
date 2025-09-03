
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
        console.error(`Webhook Error: firebaseUID or plan is missing from checkout session metadata. Session ID: ${session.id}`);
        // We cannot proceed without this information.
        return;
    }

    const adminDb = getAdminApp().firestore();
    const userRef = adminDb.doc(`users/${firebaseUID}`);
    
    try {
        await userRef.update({
            plan: plan,
            aiCredits: creditsMap[plan], // Set the credit amount for the new plan
            stripeCustomerId: session.customer, // Save or update the Stripe Customer ID
        });
        console.log(`Successfully updated plan for user ${firebaseUID} to ${plan}.`);
    } catch (error) {
        console.error(`Failed to update plan for user ${firebaseUID} to ${plan}. Error:`, error);
        // Optional: Implement retry logic or send a notification for manual intervention
    }
}


async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    // This event is useful for renewals.
    if (invoice.billing_reason !== 'subscription_cycle' || !invoice.subscription) {
        // Ignore invoices that are not for subscription renewals
        return;
    }
    
    const subscriptionId = invoice.subscription as string;

    try {
        // We need to retrieve the subscription to get our metadata
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const firebaseUID = subscription.metadata.firebaseUID;
        
        if (!firebaseUID) {
            console.error(`Renewal Webhook Error: firebaseUID is missing from subscription metadata. Subscription ID: ${subscriptionId}`);
            return;
        }
        
        // Identify the plan from the price ID
        const priceId = subscription.items.data[0]?.price.id;
        let plan: UserPlan = 'Básico'; // Default for safety
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO) {
            plan = 'Pro';
        } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS) {
            plan = 'Plus';
        }

        if (plan === 'Básico') {
            console.error(`Renewal Webhook Error: Price ID ${priceId} does not correspond to a known plan.`);
            return;
        }

        const adminDb = getAdminApp().firestore();
        const userRef = adminDb.doc(`users/${firebaseUID}`);
        
        console.log(`Renewing credits for plan ${plan} for user ${firebaseUID}...`);
        await userRef.update({
            aiCredits: creditsMap[plan], // Reset credits at the start of each billing cycle
        });
        console.log(`Successfully renewed credits for user ${firebaseUID}.`);
    } catch (error) {
        console.error(`Error handling invoice.payment_succeeded for subscription ${subscriptionId}:`, error);
    }
}


export async function POST(req: NextRequest) {
    const buf = await req.text();
    const sig = headers().get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!sig || !webhookSecret) {
            console.error("Webhook Error: Stripe signature or webhook secret is missing.");
            return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 400 });
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
                // Handles the initial subscription creation
                await handleCheckoutSessionCompleted(session);
                break;
            
             case 'invoice.payment_succeeded':
                const invoice = event.data.object as Stripe.Invoice;
                // Handles subscription renewals
                await handleInvoicePaymentSucceeded(invoice);
                break;
            
            // TODO: Handle subscription cancellations
            // case 'customer.subscription.deleted':
            //     // ... logic to downgrade the user's plan to 'Básico'
            //     break;
            
            default:
                // console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.error("Error processing webhook:", error);
        return NextResponse.json({ error: 'Internal server error while processing webhook.' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}

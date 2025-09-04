
// src/app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { UserPlan } from '@/lib/types';
import { ObjectId } from 'mongodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

const creditsMap: Record<UserPlan, number> = {
    'Básico': 0,
    'Pro': 100,
    'Plus': 300,
    'Infinity': 500,
};

// Helper function to update user plan in MongoDB
async function updateUserPlanInDb(userId: string, updates: Record<string, any>) {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    const userObjectId = new ObjectId(userId);

    await usersCollection.updateOne(
        { _id: userObjectId },
        { $set: updates }
    );
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    if (session.mode !== 'subscription') {
        console.log(`[Webhook] Skipped checkout session ${session.id} as it's not a subscription.`);
        return;
    }
    
    const subscriptionId = session.subscription as string;
    if (!subscriptionId) {
        console.error(`[Webhook Critical Error] Subscription ID missing from completed checkout session. Session ID: ${session.id}`);
        return;
    }
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // The userId should be in the subscription metadata.
    // We also check the customer metadata from the session as a fallback.
    const userId = subscription.metadata.userId || session.metadata?.userId;
    const plan = subscription.metadata.plan as UserPlan;
    const customerId = subscription.customer as string;

    if (!userId || !plan) {
        console.error(`[Webhook Critical Error] userId or plan is missing from subscription metadata. Subscription ID: ${subscription.id}`);
        return;
    }

    try {
        await updateUserPlanInDb(userId, {
            plan: plan,
            aiCredits: creditsMap[plan] || 0,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });
        
        console.log(`[Webhook] Successfully processed subscription ${subscription.id} for user ${userId} on plan ${plan}.`);

    } catch (error) {
        console.error(`[Webhook] Error handling checkout.session.completed for user ${userId}:`, error);
    }
}


async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    // A subscription can be deleted if a payment fails or if it's cancelled by the user.
    // In either case, we downgrade the user to the Básico plan.
    const userId = subscription.metadata.userId;
    if (!userId) {
        console.error(`[Webhook] Cancellation Error: userId is missing from subscription metadata. Subscription ID: ${subscription.id}`);
        return; 
    }
    
    try {
        await updateUserPlanInDb(userId, {
            plan: 'Básico',
            aiCredits: 0,
            stripeSubscriptionId: null,
            stripeCurrentPeriodEnd: null,
        });

        console.log(`[Webhook] Successfully downgraded plan for user ${userId} upon subscription cancellation/deletion.`);
    } catch (error) {
        console.error(`[Webhook] Error handling subscription cancellation for user ${userId}:`, error);
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    // The new plan is stored in the metadata of the subscription item
    const newPlan = subscription.items.data[0]?.price?.metadata?.plan as UserPlan;

    if (!userId || !newPlan) {
        console.error(`[Webhook] Update Error: userId or plan is missing from subscription metadata. Subscription ID: ${subscription.id}`);
        return;
    }

    // A subscription update can be a cancellation at the end of the period.
    // If 'cancel_at_period_end' is true, we don't downgrade them immediately.
    // The 'customer.subscription.deleted' event will handle the final downgrade.
    if (subscription.cancel_at_period_end) {
        console.log(`[Webhook] Subscription for user ${userId} is set to cancel at period end. No immediate action taken.`);
        return;
    }

    try {
        await updateUserPlanInDb(userId, {
            plan: newPlan,
            aiCredits: creditsMap[newPlan] || 0,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });

        console.log(`[Webhook] Successfully updated plan for user ${userId} to ${newPlan}.`);
    } catch (error) {
        console.error(`[Webhook] Error handling subscription update for user ${userId}:`, error);
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

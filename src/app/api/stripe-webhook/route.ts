
// src/app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb'; // Importar a conexão direta
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
    if (session.mode === 'subscription' && session.subscription) {
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const userId = subscription.metadata.userId; // Use generic userId
        const plan = subscription.metadata.plan as UserPlan;
        
        if (!userId || !plan) {
            console.error(`[Webhook Critical Error] userId or plan is missing from subscription metadata. Subscription ID: ${subscription.id}`);
            return;
        }

        try {
            await updateUserPlanInDb(userId, {
                plan: plan,
                aiCredits: creditsMap[plan] || 0,
                stripeCustomerId: subscription.customer as string,
                stripeSubscriptionId: subscription.id,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            });
            
            console.log(`[Webhook] Successfully processed subscription ${subscription.id} for user ${userId} on plan ${plan}.`);

        } catch (error) {
            console.error(`[Webhook] Error handling checkout.session.completed for user ${userId}:`, error);
        }
    } else {
         console.log(`[Webhook] Skipped processing checkout session ${session.id} as it is not a subscription.`);
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId; // Use generic userId
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

        console.log(`[Webhook] Successfully downgraded plan for user ${userId} upon subscription cancellation.`);
    } catch (error) {
        console.error(`[Webhook] Error handling subscription cancellation for user ${userId}:`, error);
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId; // Use generic userId
    const newPlan = subscription.metadata.plan as UserPlan;

    if (!userId || !newPlan) {
        console.error(`[Webhook] Update Error: userId or plan is missing from subscription metadata. Subscription ID: ${subscription.id}`);
        return;
    }

    if (subscription.status !== 'active') {
        return handleSubscriptionDeleted(subscription);
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

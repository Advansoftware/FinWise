// src/app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { getAdminApp } from '@/lib/firebase-admin';
import { UserPlan } from '@/lib/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

const creditsMap: Record<UserPlan, number> = {
    'Básico': 0,
    'Pro': 100,
    'Plus': 300,
};

async function updateUserPlan(userId: string, plan: UserPlan) {
    if (!userId) {
        throw new Error("User ID is missing in webhook metadata.");
    }
    const adminDb = getAdminApp().firestore();
    const userRef = adminDb.doc(`users/${userId}`);

    await userRef.update({
        plan: plan,
        aiCredits: creditsMap[plan],
    });
    console.log(`User ${userId} plan updated to ${plan}.`);
}


export async function POST(req: NextRequest) {
    const buf = await req.text();
    const sig = headers().get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!sig || !webhookSecret) {
            console.error("Stripe signature or webhook secret is missing.");
            return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 400 });
        }
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.firebaseUID;
            const plan = session.metadata?.plan as UserPlan;

            if (userId && plan) {
                try {
                   await updateUserPlan(userId, plan);
                } catch (error) {
                    console.error("Failed to update user plan:", error);
                    return NextResponse.json({ error: 'Failed to update user plan in database.' }, { status: 500 });
                }
            } else {
                 console.error("Missing metadata in checkout session:", session.id);
            }
            break;
        
        // TODO: Handle other subscription events like 'customer.subscription.updated', 'customer.subscription.deleted'
        // to manage plan changes, cancellations, etc.
        
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
}

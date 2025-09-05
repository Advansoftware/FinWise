// src/core/adapters/stripe/stripe-payment.adapter.ts

import {
  IPaymentService,
  CreateCheckoutSessionInput,
  CreateCheckoutSessionOutput,
  CreatePortalSessionInput,
  CreatePortalSessionOutput,
  WebhookEvent,
  SubscriptionData,
  IPaymentRepository
} from '@/core/ports/payment.port';
import { UserPlan } from '@/lib/types';
import Stripe from 'stripe';

export class StripePaymentAdapter implements IPaymentService {
  private stripe: Stripe;

  constructor(
    private paymentRepository: IPaymentRepository,
    private stripeSecretKey: string,
    private webhookSecret: string
  ) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });
  }

  private getPriceId(plan: Exclude<UserPlan, 'Básico'>): string {
    const priceIdMap = {
      'Pro': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
      'Plus': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS,
      'Infinity': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_INFINITY,
    };

    const priceId = priceIdMap[plan];
    if (!priceId) {
      throw new Error(`Price ID for plan ${plan} is not configured`);
    }

    return priceId;
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput> {
    const { userId, userEmail, plan } = input;

    try {
      const priceId = this.getPriceId(plan);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        subscription_data: {
          metadata: {
            userId: userId,
            plan: plan,
          }
        },
        success_url: `${appUrl}/billing?success=true`,
        cancel_url: `${appUrl}/billing?canceled=true`,
        customer_email: userEmail,
        metadata: { userId },
      };

      const session = await this.stripe.checkout.sessions.create(sessionConfig);

      // Store customer ID if created
      if (session.customer) {
        await this.paymentRepository.updateUserSubscription(userId, {
          customerId: session.customer as string
        });
      }

      return { url: session.url };

    } catch (error) {
      console.error('[StripePaymentAdapter] Error creating checkout session:', error);
      const errorMessage = error instanceof Stripe.errors.StripeError
        ? error.message
        : 'Unable to start payment process';
      return { url: null, error: errorMessage };
    }
  }

  async createPortalSession(input: CreatePortalSessionInput): Promise<CreatePortalSessionOutput> {
    const { userId } = input;

    try {
      // Get user's stripe customer ID from database
      const user = await this.paymentRepository.getUserByUserId(userId);

      if (!user || !user.stripeCustomerId) {
        return {
          url: null,
          error: 'Subscription management unavailable. Please contact support.'
        };
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

      const portalSession = await this.stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${appUrl}/billing`,
      });

      return { url: portalSession.url };

    } catch (error) {
      console.error('[StripePaymentAdapter] Error creating portal session:', error);
      const errorMessage = error instanceof Stripe.errors.StripeError
        ? error.message
        : 'Unable to open management portal';
      return { url: null, error: errorMessage };
    }
  }

  validateWebhookSignature(signature: string, rawBody: string): boolean {
    try {
      this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
      return true;
    } catch (error) {
      console.error('[StripePaymentAdapter] Webhook signature validation failed:', error);
      return false;
    }
  }

  async processWebhook(event: WebhookEvent): Promise<void> {
    const stripeEvent = this.stripe.webhooks.constructEvent(
      event.rawBody,
      event.signature,
      this.webhookSecret
    );

    try {
      switch (stripeEvent.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(stripeEvent.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(stripeEvent.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(stripeEvent.data.object as Stripe.Subscription);
          break;

        default:
          console.log(`[StripePaymentAdapter] Unhandled event type: ${stripeEvent.type}`);
      }
    } catch (error) {
      console.error(`[StripePaymentAdapter] Error processing webhook event ${stripeEvent.type}:`, error);
      throw error;
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    if (session.mode !== 'subscription') {
      console.log(`[StripePaymentAdapter] Skipped checkout session ${session.id} as it's not a subscription`);
      return;
    }

    const subscriptionId = session.subscription as string;
    if (!subscriptionId) {
      console.error(`[StripePaymentAdapter] Subscription ID missing from completed checkout session ${session.id}`);
      return;
    }

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata.userId;
    const plan = subscription.metadata.plan as UserPlan;
    const customerId = subscription.customer as string;

    if (!userId || !plan) {
      console.error(`[StripePaymentAdapter] userId or plan missing from subscription metadata. Subscription ID: ${subscription.id}`);
      return;
    }

    const creditsMap: Record<UserPlan, number> = {
      'Básico': 0,
      'Pro': 100,
      'Plus': 300,
      'Infinity': 500,
    };

    await this.paymentRepository.updateUserSubscription(userId, {
      subscriptionId: subscription.id,
      customerId: customerId,
      plan: plan,
      status: 'active',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: false
    });

    await this.paymentRepository.updateUserPlan(userId, plan, creditsMap[plan]);

    console.log(`[StripePaymentAdapter] Successfully processed subscription ${subscription.id} for user ${userId} on plan ${plan}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;

    if (!userId) {
      console.error(`[StripePaymentAdapter] userId missing from subscription metadata. Subscription ID: ${subscription.id}`);
      return;
    }

    // If subscription is set to cancel at period end, just update the flag
    if (subscription.cancel_at_period_end) {
      await this.paymentRepository.updateUserSubscription(userId, {
        cancelAtPeriodEnd: true
      });
      console.log(`[StripePaymentAdapter] Subscription for user ${userId} set to cancel at period end`);
      return;
    }

    // Handle plan changes
    const newPlan = subscription.items.data[0]?.price?.metadata?.plan as UserPlan;
    if (newPlan) {
      const creditsMap: Record<UserPlan, number> = {
        'Básico': 0,
        'Pro': 100,
        'Plus': 300,
        'Infinity': 500,
      };

      await this.paymentRepository.updateUserSubscription(userId, {
        plan: newPlan,
        status: subscription.status === 'active' ? 'active' : subscription.status as any,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: false
      });

      await this.paymentRepository.updateUserPlan(userId, newPlan, creditsMap[newPlan]);

      console.log(`[StripePaymentAdapter] Successfully updated plan for user ${userId} to ${newPlan}`);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;

    if (!userId) {
      console.error(`[StripePaymentAdapter] userId missing from subscription metadata. Subscription ID: ${subscription.id}`);
      return;
    }

    await this.paymentRepository.updateUserSubscription(userId, {
      plan: 'Básico',
      status: 'canceled',
      subscriptionId: undefined,
      currentPeriodEnd: undefined,
      cancelAtPeriodEnd: false
    });

    await this.paymentRepository.updateUserPlan(userId, 'Básico', 0);

    console.log(`[StripePaymentAdapter] Successfully downgraded user ${userId} to Básico plan upon subscription cancellation`);
  }
}

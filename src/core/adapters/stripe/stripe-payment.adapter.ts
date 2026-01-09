// src/core/adapters/stripe/stripe-payment.adapter.ts

import { IPaymentService, CreateCheckoutSessionInput, CreateCheckoutSessionOutput, CreatePortalSessionInput, CreatePortalSessionOutput, WebhookEvent, SubscriptionData, IPaymentRepository, GetSubscriptionOutput, CancelSubscriptionInput, CancelSubscriptionOutput, ReactivateSubscriptionInput, ReactivateSubscriptionOutput, SubscriptionDetails, UpdateSubscriptionPlanInput, UpdateSubscriptionPlanOutput } from '@/core/ports/payment.port';
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

        case 'invoice.paid':
          await this.handleInvoicePaid(stripeEvent.data.object as Stripe.Invoice);
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

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    // Only process subscription invoices
    if (!invoice.subscription) {
      console.log(`[StripePaymentAdapter] Skipped invoice ${invoice.id} as it's not a subscription invoice`);
      return;
    }

    const subscriptionId = invoice.subscription as string;
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata.userId;
    const plan = subscription.metadata.plan as UserPlan;

    if (!userId) {
      console.error(`[StripePaymentAdapter] userId missing from subscription metadata. Subscription ID: ${subscriptionId}`);
      return;
    }

    // Update the current period end date (this is the key for renewals!)
    await this.paymentRepository.updateUserSubscription(userId, {
      status: 'active',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: false
    });

    // If it's a renewal (not the first payment), add monthly credits
    if (invoice.billing_reason === 'subscription_cycle') {
      const creditsMap: Record<UserPlan, number> = {
        'Básico': 0,
        'Pro': 100,
        'Plus': 300,
        'Infinity': 500,
      };

      const monthlyCredits = plan ? creditsMap[plan] : 0;

      if (monthlyCredits > 0) {
        // Add credits for the new billing cycle
        await this.paymentRepository.addUserCredits(userId, monthlyCredits);
        console.log(`[StripePaymentAdapter] Added ${monthlyCredits} renewal credits for user ${userId}`);
      }
    }

    console.log(`[StripePaymentAdapter] Successfully processed invoice ${invoice.id} for user ${userId}. New period end: ${new Date(subscription.current_period_end * 1000).toISOString()}`);
  }

  async getSubscription(userId: string): Promise<GetSubscriptionOutput> {
    try {
      const user = await this.paymentRepository.getUserByUserId(userId);

      if (!user || !user.stripeCustomerId) {
        return { subscription: null };
      }

      // Buscar assinaturas ativas do cliente
      const subscriptions = await this.stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'all',
        limit: 1,
        expand: ['data.default_payment_method'],
      });

      if (subscriptions.data.length === 0) {
        return { subscription: null };
      }

      const subscription = subscriptions.data[0];
      const priceData = subscription.items.data[0]?.price;
      const plan = subscription.metadata.plan as UserPlan || 'Pro';

      let paymentMethod: SubscriptionDetails['paymentMethod'];
      if (subscription.default_payment_method && typeof subscription.default_payment_method === 'object') {
        const pm = subscription.default_payment_method as Stripe.PaymentMethod;
        if (pm.card) {
          paymentMethod = {
            type: 'card',
            last4: pm.card.last4,
            brand: pm.card.brand,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          };
        }
      }

      const subscriptionDetails: SubscriptionDetails = {
        id: subscription.id,
        status: subscription.status,
        plan,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        priceAmount: priceData?.unit_amount || 0,
        currency: priceData?.currency || 'brl',
        interval: priceData?.recurring?.interval || 'month',
        nextInvoiceDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
        paymentMethod,
      };

      return { subscription: subscriptionDetails };

    } catch (error) {
      console.error('[StripePaymentAdapter] Error getting subscription:', error);
      const errorMessage = error instanceof Stripe.errors.StripeError
        ? error.message
        : 'Não foi possível buscar informações da assinatura';
      return { subscription: null, error: errorMessage };
    }
  }

  async cancelSubscription(input: CancelSubscriptionInput): Promise<CancelSubscriptionOutput> {
    const { userId, immediate = false } = input;

    try {
      const user = await this.paymentRepository.getUserByUserId(userId);

      if (!user || !user.stripeCustomerId) {
        return { success: false, error: 'Assinatura não encontrada' };
      }

      // Buscar assinatura ativa
      const subscriptions = await this.stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return { success: false, error: 'Nenhuma assinatura ativa encontrada' };
      }

      const subscription = subscriptions.data[0];

      if (immediate) {
        // Cancela imediatamente
        await this.stripe.subscriptions.cancel(subscription.id);
        return { success: true };
      } else {
        // Cancela no fim do período
        const updated = await this.stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: true,
        });
        return {
          success: true,
          cancelAt: new Date(updated.current_period_end * 1000),
        };
      }

    } catch (error) {
      console.error('[StripePaymentAdapter] Error canceling subscription:', error);
      const errorMessage = error instanceof Stripe.errors.StripeError
        ? error.message
        : 'Não foi possível cancelar a assinatura';
      return { success: false, error: errorMessage };
    }
  }

  async reactivateSubscription(input: ReactivateSubscriptionInput): Promise<ReactivateSubscriptionOutput> {
    const { userId } = input;

    try {
      const user = await this.paymentRepository.getUserByUserId(userId);

      if (!user || !user.stripeCustomerId) {
        return { success: false, error: 'Assinatura não encontrada' };
      }

      // Buscar assinatura que está marcada para cancelar
      const subscriptions = await this.stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return { success: false, error: 'Nenhuma assinatura encontrada' };
      }

      const subscription = subscriptions.data[0];

      if (!subscription.cancel_at_period_end) {
        return { success: false, error: 'A assinatura não está marcada para cancelamento' };
      }

      // Reativa a assinatura
      await this.stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });

      // Atualiza o banco
      await this.paymentRepository.updateUserSubscription(userId, {
        cancelAtPeriodEnd: false,
      });

      return { success: true };

    } catch (error) {
      console.error('[StripePaymentAdapter] Error reactivating subscription:', error);
      const errorMessage = error instanceof Stripe.errors.StripeError
        ? error.message
        : 'Não foi possível reativar a assinatura';
      return { success: false, error: errorMessage };
    }
  }

  async updateSubscriptionPlan(input: UpdateSubscriptionPlanInput): Promise<UpdateSubscriptionPlanOutput> {
    const { userId, newPlan } = input;

    try {
      const user = await this.paymentRepository.getUserByUserId(userId);

      if (!user || !user.stripeCustomerId) {
        return { success: false, error: 'Assinatura não encontrada' };
      }

      // Buscar assinatura ativa
      const subscriptions = await this.stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return { success: false, error: 'Nenhuma assinatura ativa encontrada' };
      }

      const subscription = subscriptions.data[0];
      const newPriceId = this.getPriceId(newPlan);

      // Atualiza a assinatura com o novo preço
      // proration_behavior: 'create_prorations' - cobra a diferença proporcional
      const updatedSubscription = await this.stripe.subscriptions.update(subscription.id, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
        metadata: {
          ...subscription.metadata,
          plan: newPlan,
        },
      });

      // Mapear créditos
      const creditsMap: Record<UserPlan, number> = {
        'Básico': 0,
        'Pro': 100,
        'Plus': 300,
        'Infinity': 500,
      };

      // Atualiza o banco de dados
      await this.paymentRepository.updateUserSubscription(userId, {
        plan: newPlan,
        cancelAtPeriodEnd: false,
      });

      await this.paymentRepository.updateUserPlan(userId, newPlan, creditsMap[newPlan]);

      console.log(`[StripePaymentAdapter] Updated subscription ${subscription.id} to plan ${newPlan}`);

      // Retorna os detalhes atualizados
      const price = updatedSubscription.items.data[0].price;
      const defaultPaymentMethodId = updatedSubscription.default_payment_method as string | null;
      let paymentMethod = undefined;

      if (defaultPaymentMethodId) {
        try {
          const pm = await this.stripe.paymentMethods.retrieve(defaultPaymentMethodId);
          if (pm.card) {
            paymentMethod = {
              type: 'card',
              last4: pm.card.last4,
              brand: pm.card.brand,
              expMonth: pm.card.exp_month,
              expYear: pm.card.exp_year,
            };
          }
        } catch (err) {
          console.warn('[StripePaymentAdapter] Could not retrieve payment method:', err);
        }
      }

      return {
        success: true,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          plan: newPlan,
          currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
          cancelAt: updatedSubscription.cancel_at ? new Date(updatedSubscription.cancel_at * 1000) : null,
          priceAmount: price.unit_amount || 0,
          currency: price.currency,
          interval: (price.recurring?.interval) || 'month',
          nextInvoiceDate: updatedSubscription.current_period_end ? new Date(updatedSubscription.current_period_end * 1000) : null,
          paymentMethod,
        },
      };

    } catch (error) {
      console.error('[StripePaymentAdapter] Error updating subscription plan:', error);
      const errorMessage = error instanceof Stripe.errors.StripeError
        ? error.message
        : 'Não foi possível atualizar o plano';
      return { success: false, error: errorMessage };
    }
  }
}

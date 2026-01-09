// src/app/api/payments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  createCheckoutSessionAction,
  createPortalSessionAction,
  getSubscriptionAction,
  cancelSubscriptionAction,
  reactivateSubscriptionAction
} from '@/core/actions/payment.actions';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const body = await req.json();

    switch (action) {
      case 'createCheckoutSession':
        const checkoutResult = await createCheckoutSessionAction(body);
        return NextResponse.json(checkoutResult);

      case 'createPortalSession':
        const portalResult = await createPortalSessionAction(body);
        return NextResponse.json(portalResult);

      case 'getSubscription':
        const subscriptionResult = await getSubscriptionAction(body.userId);
        return NextResponse.json(subscriptionResult);

      case 'cancelSubscription':
        const cancelResult = await cancelSubscriptionAction(body);
        return NextResponse.json(cancelResult);

      case 'reactivateSubscription':
        const reactivateResult = await reactivateSubscriptionAction(body);
        return NextResponse.json(reactivateResult);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[PaymentAPI] Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

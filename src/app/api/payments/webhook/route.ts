// src/app/api/payments/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getPaymentService } from '@/core/services/service-factory';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('[PaymentWebhook] Missing stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const paymentService = await getPaymentService();

    // Validate webhook signature
    if (!paymentService.validateWebhookSignature(signature, rawBody)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Process webhook event
    await paymentService.processWebhook({
      type: '', // Will be extracted by the service
      data: {},
      signature,
      rawBody
    });

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[PaymentWebhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing webhook' },
      { status: 500 }
    );
  }
}

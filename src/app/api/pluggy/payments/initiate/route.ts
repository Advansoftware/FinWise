// src/app/api/pluggy/payments/initiate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getPluggyService, PluggyPaymentIntent } from '@/services/pluggy';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * POST /api/pluggy/payments/initiate
 * Initiate a PIX payment through Pluggy
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      amount,
      description,
      recipientId,
      // Alternative: create recipient on-the-fly
      recipientData,
      // For tracking purposes
      installmentId,
      callbackUrls,
    } = body;

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'userId and amount are required' },
        { status: 400 }
      );
    }

    if (!recipientId && !recipientData) {
      return NextResponse.json(
        { error: 'Either recipientId or recipientData is required' },
        { status: 400 }
      );
    }

    const pluggyService = getPluggyService();
    const { db } = await connectToDatabase();

    let finalRecipientId = recipientId;

    // Create recipient if data provided instead of ID
    if (!recipientId && recipientData) {
      const recipient = await pluggyService.createPaymentRecipient({
        taxNumber: recipientData.taxNumber,
        name: recipientData.name,
        paymentInstitutionId: recipientData.paymentInstitutionId,
        account: {
          branch: recipientData.branch,
          number: recipientData.accountNumber,
          type: recipientData.accountType || 'CHECKING',
        },
        pixKey: recipientData.pixKey,
      });
      finalRecipientId = recipient.id;
    }

    // Get or create payment customer for the user
    let customerId: string | undefined;

    const userCustomer = await db
      .collection('pluggy_customers')
      .findOne({ userId });

    if (userCustomer) {
      customerId = userCustomer.pluggyCustomerId;
    }

    // Create payment request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const paymentRequest = await pluggyService.createPaymentRequest({
      amount,
      description: description || `Pagamento via Gastometria`,
      recipientId: finalRecipientId,
      customerId,
      callbackUrls: callbackUrls || {
        success: `${baseUrl}/pagamento/sucesso`,
        error: `${baseUrl}/pagamento/erro`,
      },
    });

    // Store payment record
    await db.collection('pluggy_payments').insertOne({
      userId,
      paymentRequestId: paymentRequest.id,
      amount,
      description,
      recipientId: finalRecipientId,
      installmentId,
      status: paymentRequest.status,
      paymentUrl: paymentRequest.paymentUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // If there's an installment, link this payment to it
    if (installmentId) {
      await db.collection('installments').updateOne(
        { _id: installmentId },
        {
          $set: {
            pluggyPaymentRequestId: paymentRequest.id,
            updatedAt: new Date().toISOString(),
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      paymentRequest: {
        id: paymentRequest.id,
        paymentUrl: paymentRequest.paymentUrl,
        status: paymentRequest.status,
      },
    });
  } catch (error: any) {
    console.error('Error initiating Pluggy payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pluggy/payments/initiate
 * Get status of a payment request
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentRequestId = searchParams.get('paymentRequestId');

    if (!paymentRequestId) {
      return NextResponse.json(
        { error: 'paymentRequestId is required' },
        { status: 400 }
      );
    }

    const pluggyService = getPluggyService();
    const paymentRequest = await pluggyService.getPaymentRequest(paymentRequestId);

    // Also get intents if any
    let intents: PluggyPaymentIntent[] = [];
    try {
      intents = await pluggyService.listPaymentIntents(paymentRequestId);
    } catch {
      // May not have intents yet
    }

    return NextResponse.json({
      paymentRequest,
      intents,
      latestIntent: intents[0] || null,
    });
  } catch (error: any) {
    console.error('Error getting Pluggy payment status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get payment status' },
      { status: 500 }
    );
  }
}

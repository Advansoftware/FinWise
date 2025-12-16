// src/app/api/pluggy/payments/initiate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getPluggyService, PluggyPaymentIntent } from '@/services/pluggy';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * POST /api/pluggy/payments/initiate
 * Initiate a PIX payment through Pluggy
 * 
 * Supports three modes:
 * 1. recipientId - Use an existing Pluggy recipient ID
 * 2. pixKey - Create recipient from PIX key using DICT lookup (PREFERRED)
 * 3. recipientData - Create recipient with full account details
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      amount,
      description,
      recipientId,
      // NEW: Just pass the PIX key and we'll create recipient automatically
      pixKey,
      receiverName,
      // Alternative: create recipient with full data
      recipientData,
      // For tracking purposes
      installmentId,
      contactId,
      pixKeyId,
      callbackUrls,
    } = body;

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'userId and amount are required' },
        { status: 400 }
      );
    }

    // Must have one of: recipientId, pixKey, or recipientData
    if (!recipientId && !pixKey && !recipientData) {
      return NextResponse.json(
        { error: 'One of recipientId, pixKey, or recipientData is required' },
        { status: 400 }
      );
    }

    const pluggyService = getPluggyService();
    const { db } = await connectToDatabase();

    let finalRecipientId = recipientId;

    // OPTION 1: Validate existing recipientId
    if (recipientId) {
      // SECURITY: Validate that the recipientId belongs to the user
      const contactWithRecipient = await db.collection('payment_contacts').findOne({
        userId,
        'pixKeys.pluggyRecipientId': recipientId
      });

      if (!contactWithRecipient) {
        return NextResponse.json(
          { error: 'Invalid recipientId: recipient not found or does not belong to this user' },
          { status: 403 }
        );
      }
    }

    // OPTION 2: Create recipient from PIX key (try DICT lookup)
    if (!recipientId && pixKey) {
      try {
        console.log(`Creating Pluggy recipient from PIX key: ${pixKey}`);

        // Try to create recipient using the PIX key
        // Note: This may require the Pluggy API to support DICT lookup
        // If it fails, we'll provide a helpful error message
        const recipient = await pluggyService.createPaymentRecipientFromPixKey(
          pixKey,
          receiverName
        );

        finalRecipientId = recipient.id;
        console.log(`Created Pluggy recipient: ${finalRecipientId}`);

        // Save the pluggyRecipientId for future use
        if (contactId && pixKeyId) {
          await db.collection('payment_contacts').updateOne(
            {
              _id: contactId,
              userId,
              'pixKeys.id': pixKeyId
            },
            {
              $set: {
                'pixKeys.$.pluggyRecipientId': finalRecipientId,
                updatedAt: new Date().toISOString()
              }
            }
          );
        }
      } catch (pixKeyError: any) {
        console.error('Failed to create recipient from PIX key:', pixKeyError);

        // Check if it's a "not found" or "not supported" error
        const errorMessage = pixKeyError.message || '';

        if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('Not Found')) {
          // The PIX key endpoint might not be supported
          // Try creating a recipient with just the pixKey field
          try {
            console.log('PIX key endpoint not available, trying alternative method...');

            // Some APIs allow creating a recipient with just the PIX key
            // The backend will do the DICT lookup
            const recipient = await pluggyService.createPaymentRecipient({
              taxNumber: '00000000000', // Placeholder - DICT lookup should fill this
              name: receiverName || 'Destinatário PIX',
              paymentInstitutionId: '', // Will be determined by DICT lookup
              account: {
                branch: '0001',
                number: '00000000',
                type: 'CHECKING',
              },
              pixKey: pixKey,
            });

            finalRecipientId = recipient.id;
            console.log(`Created Pluggy recipient via alternative method: ${finalRecipientId}`);
          } catch (altError: any) {
            console.error('Alternative method also failed:', altError);

            return NextResponse.json(
              {
                error: 'O Pluggy não suporta pagamento PIX apenas com a chave. É necessário ter o QR Code PIX ou dados completos do destinatário.',
                details: 'Para usar Open Finance, escaneie o QR Code PIX do destinatário ou use o método de Deep Link (app do banco).',
                technicalError: altError.message
              },
              { status: 400 }
            );
          }
        } else {
          // Other error - return it
          return NextResponse.json(
            {
              error: 'Não foi possível criar destinatário com a chave PIX. Verifique se a chave está correta.',
              details: pixKeyError.message
            },
            { status: 400 }
          );
        }
      }
    }

    // OPTION 3: Create recipient with full account data
    if (!recipientId && !pixKey && recipientData) {
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

      // Save the pluggyRecipientId for future use
      if (contactId && pixKeyId) {
        await db.collection('payment_contacts').updateOne(
          {
            _id: contactId,
            userId,
            'pixKeys.id': pixKeyId
          },
          {
            $set: {
              'pixKeys.$.pluggyRecipientId': finalRecipientId,
              updatedAt: new Date().toISOString()
            }
          }
        );
      }
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

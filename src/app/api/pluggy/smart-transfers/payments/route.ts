// src/app/api/pluggy/smart-transfers/payments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getPluggyService } from '@/services/pluggy';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/pluggy/smart-transfers/payments
 * List user's payments or get a specific one
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const paymentId = searchParams.get('paymentId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get specific payment
    if (paymentId) {
      const pluggyService = getPluggyService();

      // First check if this payment belongs to the user
      const storedPayment = await db.collection('smart_transfer_payments').findOne({
        userId,
        pluggyPaymentId: paymentId
      });

      if (!storedPayment) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }

      // Get latest status from Pluggy
      const payment = await pluggyService.getSmartTransferPayment(paymentId);

      // Update stored status if changed
      if (payment.status !== storedPayment.status) {
        await db.collection('smart_transfer_payments').updateOne(
          { _id: storedPayment._id },
          {
            $set: {
              status: payment.status,
              paymentReceipt: payment.paymentReceipt,
              updatedAt: new Date().toISOString()
            }
          }
        );

        // If payment completed and has installmentId, mark installment as paid
        if (payment.status === 'PAYMENT_COMPLETED' && storedPayment.installmentId) {
          await db.collection('installments').updateOne(
            { _id: new ObjectId(storedPayment.installmentId) },
            {
              $set: {
                'payments.$[elem].status': 'paid',
                'payments.$[elem].paidAt': payment.paymentReceipt?.completedAt || new Date().toISOString(),
                'payments.$[elem].endToEndId': payment.paymentReceipt?.endToEndId,
                updatedAt: new Date().toISOString(),
              }
            },
            {
              arrayFilters: [{ 'elem.installmentNumber': storedPayment.installmentNumber }]
            }
          );
        }
      }

      return NextResponse.json({ payment, storedPayment });
    }

    // List all user's payments
    const payments = await db.collection('smart_transfer_payments')
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ payments });

  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pluggy/smart-transfers/payments
 * Create a new payment using Smart Transfers (automatic, no user interaction)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      preauthorizationId, // Optional - will find active one if not provided
      recipientId,
      amount,
      description,
      // For tracking
      installmentId,
      installmentNumber,
      walletId, // To update wallet balance after payment
    } = body;

    if (!userId || !recipientId || !amount) {
      return NextResponse.json(
        { error: 'userId, recipientId, and amount are required' },
        { status: 400 }
      );
    }

    const pluggyService = getPluggyService();
    const { db } = await connectToDatabase();

    // Find active preauthorization if not provided
    let activePreauthorizationId = preauthorizationId;

    if (!activePreauthorizationId) {
      const activeAuth = await db.collection('smart_transfer_preauthorizations').findOne({
        userId,
        status: 'COMPLETED',
        recipientIds: recipientId, // Must include this recipient
      });

      if (!activeAuth) {
        return NextResponse.json(
          {
            error: 'Nenhuma autorização ativa encontrada para este destinatário',
            code: 'NO_ACTIVE_PREAUTHORIZATION',
            message: 'O usuário precisa criar uma pré-autorização primeiro. Redirecione para o fluxo de configuração.'
          },
          { status: 400 }
        );
      }

      activePreauthorizationId = activeAuth.pluggyPreauthorizationId;
    }

    // Validate recipient belongs to user
    const contact = await db.collection('payment_contacts').findOne({
      userId,
      'pixKeys.pluggyRecipientId': recipientId
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Recipient not found or does not belong to this user' },
        { status: 403 }
      );
    }

    // Create payment in Pluggy
    const clientPaymentId = `finwise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const payment = await pluggyService.createSmartTransferPayment({
      preauthorizationId: activePreauthorizationId,
      recipientId,
      amount,
      description: description || `Pagamento via FinWise`,
      clientPaymentId,
    });

    // Store payment in database
    const storedPayment = await db.collection('smart_transfer_payments').insertOne({
      userId,
      pluggyPaymentId: payment.id,
      preauthorizationId: activePreauthorizationId,
      recipientId,
      amount,
      description,
      status: payment.status,
      clientPaymentId,
      installmentId,
      installmentNumber,
      walletId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // If payment is already completed, update related records
    if (payment.status === 'PAYMENT_COMPLETED') {
      // Update wallet balance
      if (walletId) {
        await db.collection('wallets').updateOne(
          { _id: new ObjectId(walletId) },
          { $inc: { balance: -amount } }
        );
      }

      // Create transaction record
      await db.collection('transactions').insertOne({
        userId,
        date: new Date().toISOString(),
        item: description || 'Pagamento PIX via Open Finance',
        category: 'Pagamentos',
        amount: -amount,
        type: 'expense',
        walletId,
        smartTransferPaymentId: payment.id,
        endToEndId: payment.paymentReceipt?.endToEndId,
        createdAt: new Date().toISOString(),
      });

      // Update installment if provided
      if (installmentId && installmentNumber) {
        await db.collection('installments').updateOne(
          { _id: new ObjectId(installmentId) },
          {
            $set: {
              'payments.$[elem].status': 'paid',
              'payments.$[elem].paidAt': payment.paymentReceipt?.completedAt || new Date().toISOString(),
              'payments.$[elem].endToEndId': payment.paymentReceipt?.endToEndId,
              updatedAt: new Date().toISOString(),
            }
          },
          {
            arrayFilters: [{ 'elem.installmentNumber': installmentNumber }]
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        description: payment.description,
        paymentReceipt: payment.paymentReceipt,
      },
      storedId: storedPayment.insertedId.toString(),
      message: payment.status === 'PAYMENT_COMPLETED'
        ? 'Pagamento realizado com sucesso!'
        : 'Pagamento em processamento...',
    });

  } catch (error: any) {
    console.error('Error creating smart transfer payment:', error);

    // Handle specific Pluggy errors
    if (error.message?.includes('limit')) {
      return NextResponse.json(
        {
          error: 'Limite de transação excedido',
          details: error.message
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}

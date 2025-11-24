// src/app/api/bank-payment/requests/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MongoBankPaymentRepository } from '@/core/adapters/mongodb/mongodb-bank-payment.adapter';
import { createPushNotificationService, createPaymentRequestPayload } from '@/services/push-notification.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const repository = new MongoBankPaymentRepository(db);

    const requests = await repository.findPaymentRequestsByUserId(userId, limit);

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('Erro ao buscar solicitações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar solicitações', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const body = await request.json();

    // Validação básica
    if (!body.paymentData || !body.originDevice) {
      return NextResponse.json(
        { error: 'paymentData e originDevice são obrigatórios' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const repository = new MongoBankPaymentRepository(db);

    // Criar solicitação de pagamento
    const paymentRequest = await repository.createPaymentRequest(userId, body);

    let pushSent = false;
    let targetDevice = null;

    // Se origem é desktop e deve enviar push
    if (body.originDevice === 'desktop' && body.sendPush) {
      // Buscar dispositivo móvel primário
      const primaryDevice = await repository.findPrimaryDevice(userId);

      if (primaryDevice && primaryDevice.type === 'mobile' && primaryDevice.pushEndpoint) {
        // Enviar push notification
        const pushService = createPushNotificationService();
        const payload = createPaymentRequestPayload(
          paymentRequest.id,
          body.paymentData.amount,
          body.paymentData.description,
          body.paymentData.receiverName
        );

        pushSent = await pushService.sendPushNotification(primaryDevice, payload);

        if (pushSent) {
          // Atualizar status para 'sent'
          await repository.updatePaymentRequestStatus(paymentRequest.id, 'sent');
          await repository.addPaymentEvent(paymentRequest.id, {
            type: 'push_sent',
            timestamp: new Date().toISOString(),
            deviceId: primaryDevice.id,
          });

          targetDevice = {
            id: primaryDevice.id,
            name: primaryDevice.name,
          };
        }
      } else {
        // Se não há dispositivo móvel, verificar outros dispositivos
        const devices = await repository.findDevicesByUserId(userId);
        const mobileDevice = devices.find(d => d.type === 'mobile' && d.pushEndpoint);

        if (mobileDevice) {
          const pushService = createPushNotificationService();
          const payload = createPaymentRequestPayload(
            paymentRequest.id,
            body.paymentData.amount,
            body.paymentData.description,
            body.paymentData.receiverName
          );

          pushSent = await pushService.sendPushNotification(mobileDevice, payload);

          if (pushSent) {
            await repository.updatePaymentRequestStatus(paymentRequest.id, 'sent');
            await repository.addPaymentEvent(paymentRequest.id, {
              type: 'push_sent',
              timestamp: new Date().toISOString(),
              deviceId: mobileDevice.id,
            });

            targetDevice = {
              id: mobileDevice.id,
              name: mobileDevice.name,
            };
          }
        }
      }
    }

    return NextResponse.json({
      paymentRequest,
      pushSent,
      targetDevice,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao criar solicitação', message: error.message },
      { status: 500 }
    );
  }
}

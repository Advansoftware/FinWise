// src/services/push-notification.service.ts

import webpush from 'web-push';
import {
  UserDevice,
  PushPayload,
  IPushNotificationService,
} from '@/core/ports/bank-payment.port';

/**
 * Serviço de Web Push Notifications
 */
export class PushNotificationService implements IPushNotificationService {
  private vapidPublicKey: string;
  private vapidPrivateKey: string;
  private vapidSubject: string;

  constructor() {
    this.vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
    this.vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
    this.vapidSubject = process.env.VAPID_SUBJECT || 'mailto:suporte@gastometria.com.br';

    if (this.vapidPublicKey && this.vapidPrivateKey) {
      webpush.setVapidDetails(
        this.vapidSubject,
        this.vapidPublicKey,
        this.vapidPrivateKey
      );
    }
  }

  /**
   * Envia notificação push para um dispositivo
   */
  async sendPushNotification(device: UserDevice, payload: PushPayload): Promise<boolean> {
    if (!device.pushEndpoint || !device.pushP256dh || !device.pushAuth) {
      console.error('Dispositivo não tem subscription de push configurada');
      return false;
    }

    const subscription = {
      endpoint: device.pushEndpoint,
      keys: {
        p256dh: device.pushP256dh,
        auth: device.pushAuth,
      },
    };

    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify(payload),
        {
          TTL: 60 * 30, // 30 minutos
          urgency: 'high',
          topic: 'payment-request',
        }
      );

      console.log(`Push enviado com sucesso para dispositivo ${device.id}`);
      return true;
    } catch (error: any) {
      console.error('Erro ao enviar push:', error);

      // Se o erro for 410 (Gone), o subscription expirou
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log('Subscription expirou ou foi removida');
        // Aqui poderia marcar o dispositivo como inativo
      }

      return false;
    }
  }

  /**
   * Gera par de chaves VAPID
   */
  generateVapidKeys(): { publicKey: string; privateKey: string } {
    const keys = webpush.generateVAPIDKeys();
    return {
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
    };
  }

  /**
   * Retorna a chave pública VAPID
   */
  getPublicKey(): string {
    return this.vapidPublicKey;
  }
}

// Factory function para uso no server-side
export function createPushNotificationService(): PushNotificationService {
  return new PushNotificationService();
}

/**
 * Cria payload de notificação para solicitação de pagamento
 */
export function createPaymentRequestPayload(
  paymentRequestId: string,
  amount: number,
  description?: string,
  receiverName?: string
): PushPayload {
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);

  const title = '💰 Solicitação de Pagamento';
  const body = receiverName
    ? `${formattedAmount} para ${receiverName}${description ? ` - ${description}` : ''}`
    : `${formattedAmount}${description ? ` - ${description}` : ''}`;

  return {
    title,
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: `payment-${paymentRequestId}`,
    data: {
      type: 'payment_request',
      paymentRequestId,
      url: `/confirmar?id=${paymentRequestId}`,
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icons/icon-open.png',
      },
      {
        action: 'dismiss',
        title: 'Dispensar',
        icon: '/icons/icon-dismiss.png',
      },
    ],
  };
}

/**
 * Cria payload para lembrete de vencimento
 */
export function createPaymentDuePayload(
  installmentName: string,
  amount: number,
  dueDate: string,
  daysUntilDue: number
): PushPayload {
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);

  const title = daysUntilDue === 0
    ? '⚠️ Vencimento Hoje!'
    : daysUntilDue === 1
      ? '📅 Vencimento Amanhã'
      : `📅 Vence em ${daysUntilDue} dias`;

  const body = `${installmentName}: ${formattedAmount} - ${dueDate}`;

  return {
    title,
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: `due-${installmentName}-${dueDate}`,
    data: {
      type: 'payment_request',
      paymentRequestId: '',
      url: '/installments',
    },
    actions: [
      {
        action: 'pay',
        title: 'Pagar Agora',
        icon: '/icons/icon-pay.png',
      },
      {
        action: 'snooze',
        title: 'Lembrar Depois',
        icon: '/icons/icon-snooze.png',
      },
    ],
  };
}

/**
 * Cria payload para parcela em atraso
 */
export function createPaymentOverduePayload(
  installmentName: string,
  amount: number,
  daysOverdue: number
): PushPayload {
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);

  const title = '🚨 Parcela em Atraso!';
  const body = `${installmentName}: ${formattedAmount} - ${daysOverdue} dia${daysOverdue > 1 ? 's' : ''} de atraso`;

  return {
    title,
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: `overdue-${installmentName}`,
    data: {
      type: 'payment_request',
      paymentRequestId: '',
      url: '/installments',
    },
    actions: [
      {
        action: 'pay',
        title: 'Pagar Agora',
        icon: '/icons/icon-pay.png',
      },
      {
        action: 'view',
        title: 'Ver Detalhes',
        icon: '/icons/icon-view.png',
      },
    ],
  };
}

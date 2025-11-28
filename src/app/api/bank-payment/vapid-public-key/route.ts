// src/app/api/bank-payment/vapid-public-key/route.ts

import { NextResponse } from 'next/server';

// Você precisa gerar essas chaves VAPID usando web-push
// npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';

export async function GET() {
  if (!VAPID_PUBLIC_KEY) {
    return NextResponse.json(
      {
        error: 'VAPID_PUBLIC_KEY não configurada',
        message: 'Configure a variável de ambiente VAPID_PUBLIC_KEY para habilitar push notifications'
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ publicKey: VAPID_PUBLIC_KEY });
}

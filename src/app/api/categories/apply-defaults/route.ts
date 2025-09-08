// src/app/api/categories/apply-defaults/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId é obrigatório' },
        { status: 400 }
      );
    }

    // Importar dinamicamente o serviço para evitar problemas com 'use server'
    const { setupDefaultUserData } = await import('@/services/default-setup-service');
    await setupDefaultUserData(userId);

    return NextResponse.json(
      { message: 'Categorias padrão aplicadas com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao aplicar categorias padrão:', error);

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
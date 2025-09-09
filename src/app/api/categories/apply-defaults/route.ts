
// src/app/api/categories/apply-defaults/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/core/services/service-factory';
import { DEFAULT_CATEGORIES } from '@/services/default-setup-service';

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

    const db = await getDatabaseAdapter();
    const settings = await db.settings.findByUserId(userId);
    const existingCategories = settings?.categories || {};

    const mergedCategories = { ...existingCategories };

    Object.entries(DEFAULT_CATEGORIES).forEach(([category, subcategories]) => {
      if (!mergedCategories[category]) {
        // Categoria não existe, adiciona completamente
        mergedCategories[category] = subcategories;
      } else {
        // Categoria existe, adiciona apenas subcategorias novas
        const existingSubcategories = new Set(mergedCategories[category]);
        subcategories.forEach(sub => existingSubcategories.add(sub));
        mergedCategories[category] = Array.from(existingSubcategories).sort();
      }
    });

    const newSettings = {
      ...(settings || {}),
      categories: mergedCategories,
    };

    await db.settings.updateByUserId(userId, newSettings);

    return NextResponse.json(
      { message: 'Categorias padrão adicionadas com sucesso' },
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

    
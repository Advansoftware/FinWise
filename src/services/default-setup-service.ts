
'use server';

import { TransactionCategory } from '@/lib/types';
import { getDatabaseAdapter } from '@/core/services/service-factory';
import { DEFAULT_CATEGORIES, DEFAULT_USER_SETTINGS } from '@/lib/default-categories';

/**
 * Configura dados padrão para um novo usuário
 * @param userId - ID do usuário recém-criado
 */
export async function setupDefaultUserData(userId: string): Promise<void> {
  try {
    console.log(`🔧 Configurando dados padrão para usuário ${userId}...`);

    const db = await getDatabaseAdapter();
    // Salvar configurações padrão (incluindo categorias)
    await db.settings.updateByUserId(userId, DEFAULT_USER_SETTINGS);

    console.log(`✅ Dados padrão configurados com sucesso para usuário ${userId}`);
    console.log(`📂 ${Object.keys(DEFAULT_CATEGORIES).length} categorias criadas`);

  } catch (error) {
    console.error(`❌ Erro ao configurar dados padrão para usuário ${userId}:`, error);
    throw error;
  }
}

/**
 * Verifica se o usuário já possui dados configurados
 * @param userId - ID do usuário
 * @returns boolean indicando se já possui configuração
 */
export async function hasUserData(userId: string): Promise<boolean> {
  try {
    const db = await getDatabaseAdapter();
    const settings = await db.settings.findByUserId(userId);
    return !!(settings && settings.categories && Object.keys(settings.categories).length > 0);
  } catch (error) {
    console.error('Erro ao verificar dados do usuário:', error);
    return false;
  }
}

/**
 * Migra usuários existentes para o novo sistema de categorias padrão
 * @param userId - ID do usuário
 */
export async function migrateExistingUser(userId: string): Promise<void> {
  try {
    const hasData = await hasUserData(userId);

    if (!hasData) {
      console.log(`🔄 Migrando usuário existente ${userId} para categorias padrão...`);
      await setupDefaultUserData(userId);
    } else {
      console.log(`✅ Usuário ${userId} já possui dados configurados`);
    }
  } catch (error) {
    console.error(`❌ Erro na migração do usuário ${userId}:`, error);
    throw error;
  }
}

/**
 * Adiciona novas categorias padrão sem sobrescrever as existentes
 * @param userId - ID do usuário
 * @param newCategories - Novas categorias para adicionar
 */
export async function addNewDefaultCategories(
  userId: string,
  newCategories: Record<TransactionCategory, string[]>
): Promise<void> {
  try {
    const db = await getDatabaseAdapter();
    const settings = await db.settings.findByUserId(userId) || {};
    const existingCategories = settings.categories || {};

    // Mescla categorias existentes com novas (sem sobrescrever)
    const mergedCategories = { ...existingCategories };

    Object.entries(newCategories).forEach(([category, subcategories]) => {
      const categoryKey = category as TransactionCategory;

      if (!mergedCategories[categoryKey]) {
        // Categoria não existe, adiciona completamente
        mergedCategories[categoryKey] = subcategories;
      } else {
        // Categoria existe, adiciona apenas subcategorias novas
        const existingSubcategories = new Set(mergedCategories[categoryKey] || []);
        subcategories.forEach(sub => existingSubcategories.add(sub));

        mergedCategories[categoryKey] = Array.from(existingSubcategories).sort();
      }
    });

    // Salva as configurações atualizadas
    await db.settings.updateByUserId(userId, {
      ...settings,
      categories: mergedCategories
    });

    console.log(`✅ Novas categorias adicionadas para usuário ${userId}`);
  } catch (error) {
    console.error(`❌ Erro ao adicionar novas categorias para usuário ${userId}:`, error);
    throw error;
  }
}


'use server';

import { TransactionCategory } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

// Categorias e subcategorias padrão que serão criadas para novos usuários
export const DEFAULT_CATEGORIES: Record<TransactionCategory, string[]> = {
  // RECEITAS
  "Salário": [
    "Salário principal",
    "Hora extra",
    "Comissão",
    "Bonificação",
    "13º salário"
  ],
  "Investimentos": [
    "Dividendos",
    "Juros",
    "Rendimento poupança",
    "Renda fixa",
    "Renda variável"
  ],
  "Vendas": [
    "Produto vendido",
    "Serviço prestado",
    "Freelance",
    "Consultoria"
  ],

  // DESPESAS ESSENCIAIS
  "Contas": [
    "Energia elétrica",
    "Água",
    "Gás",
    "Internet",
    "Telefone",
    "Condomínio",
    "IPTU",
    "Seguro casa",
    "Financiamento imóvel"
  ],
  "Supermercado": [
    "Compras do mês",
    "Feira",
    "Açougue",
    "Padaria",
    "Limpeza",
    "Higiene pessoal"
  ],
  "Transporte": [
    "Combustível",
    "Uber/99",
    "Ônibus",
    "Metrô",
    "Estacionamento",
    "Manutenção veículo",
    "Seguro veículo",
    "IPVA",
    "Pedágio"
  ],
  "Saúde": [
    "Plano de saúde",
    "Consulta médica",
    "Medicamentos",
    "Exames",
    "Dentista",
    "Academia",
    "Suplementos"
  ],

  // DESPESAS PESSOAIS
  "Restaurante": [
    "Almoço",
    "Jantar",
    "Delivery",
    "Lanche",
    "Fast food",
    "Bar",
    "Cafeteria"
  ],
  "Entretenimento": [
    "Cinema",
    "Teatro",
    "Shows",
    "Streaming",
    "Games",
    "Livros",
    "Revistas",
    "Viagens",
    "Passeios"
  ],
  "Vestuário": [
    "Roupas",
    "Sapatos",
    "Acessórios",
    "Perfumes",
    "Maquiagem",
    "Cabeleireiro"
  ],
  "Educação": [
    "Mensalidade escolar",
    "Curso",
    "Material escolar",
    "Livros didáticos",
    "Transporte escolar"
  ],
  "Lazer": [
    "Hobbies",
    "Esportes",
    "Viagens",
    "Presentes",
    "Decoração",
    "Jardinagem"
  ],

  // OUTROS E TRANSFERÊNCIAS
  "Outros": [
    "Diversos",
    "Imprevistos",
    "Doações",
    "Multas",
    "Taxas bancárias"
  ],
  "Transferência": [
    "Entre contas",
    "Poupança",
    "Investimento",
    "Pagamento cartão"
  ]
};

// Configurações padrão do usuário
export const DEFAULT_USER_SETTINGS = {
  categories: DEFAULT_CATEGORIES,
  preferences: {
    dateFormat: 'dd/MM/yyyy',
    currency: 'BRL',
    theme: 'system',
    notifications: {
      budgetAlerts: true,
      monthlyReports: true,
      goalReminders: true
    }
  },
  aiSettings: {
    credentials: [],
    activeCredentialId: null
  }
};

/**
 * Configura dados padrão para um novo usuário
 * @param userId - ID do usuário recém-criado
 */
export async function setupDefaultUserData(userId: string): Promise<void> {
  try {
    console.log(`🔧 Configurando dados padrão para usuário ${userId}...`);

    // Salvar configurações padrão (incluindo categorias)
    await apiClient.update('settings', userId, DEFAULT_USER_SETTINGS);

    console.log(`✅ Dados padrão configurados com sucesso para usuário ${userId}`);
    console.log(`📂 ${Object.keys(DEFAULT_CATEGORIES).length} categorias criadas`);

    // Log das categorias criadas para debug
    Object.entries(DEFAULT_CATEGORIES).forEach(([category, subcategories]) => {
      console.log(`   📁 ${category}: ${subcategories.length} subcategorias`);
    });

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
    const settings = await apiClient.get('settings', userId);
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
    const settings = await apiClient.get('settings', userId) || {};
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
        const existingSubcategories = mergedCategories[categoryKey] || [];
        const newSubcategories = subcategories.filter(
          sub => !existingSubcategories.includes(sub)
        );

        if (newSubcategories.length > 0) {
          mergedCategories[categoryKey] = [
            ...existingSubcategories,
            ...newSubcategories
          ].sort();
        }
      }
    });

    // Salva as configurações atualizadas
    await apiClient.update('settings', userId, {
      ...settings,
      categories: mergedCategories
    });

    console.log(`✅ Novas categorias adicionadas para usuário ${userId}`);
  } catch (error) {
    console.error(`❌ Erro ao adicionar novas categorias para usuário ${userId}:`, error);
    throw error;
  }
}

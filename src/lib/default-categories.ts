import {TransactionCategory} from '@/lib/types';

// Categorias e subcategorias padrão que serão criadas para novos usuários
export const DEFAULT_CATEGORIES: Record<TransactionCategory, string[]> = {
  // RECEITAS
  "Salário": [
    "Salário principal",
    "Horas extras",
    "Comissões",
    "Bonificações"
  ],
  "Investimentos": [
    "Dividendos",
    "Juros",
    "Rendimentos",
    "Aluguéis recebidos"
  ],
  "Vendas": [
    "Freelances",
    "Consultorias",
    "Projetos pontuais",
    "Vendas diversas"
  ],

  // DESPESAS ESSENCIAIS
  "Supermercado": [
    "Alimentos básicos",
    "Produtos de limpeza",
    "Higiene pessoal",
    "Bebidas"
  ],
  "Transporte": [
    "Combustível",
    "Transporte público",
    "Uber/Taxi",
    "Manutenção veicular",
    "Seguro veicular",
    "IPVA",
    "Estacionamento"
  ],
  "Contas": [
    "Energia elétrica",
    "Água e esgoto",
    "Gás",
    "Internet",
    "Telefone",
    "TV por assinatura",
    "Aluguel/Financiamento",
    "Condomínio"
  ],
  "Saúde": [
    "Plano de saúde",
    "Consultas médicas",
    "Medicamentos",
    "Exames",
    "Dentista",
    "Terapias"
  ],

  // DESPESAS PESSOAIS
  "Educação": [
    "Mensalidades",
    "Cursos",
    "Livros",
    "Material escolar",
    "Certificações"
  ],
  "Lazer": [
    "Cinema/Teatro",
    "Viagens",
    "Hobbies",
    "Esportes",
    "Eventos",
    "Games"
  ],
  "Entretenimento": [
    "Streaming",
    "Games",
    "Eventos",
    "Shows",
    "Festivais"
  ],
  "Restaurante": [
    "Almoços",
    "Jantares",
    "Delivery",
    "Fast food",
    "Cafés"
  ],
  "Vestuário": [
    "Roupas",
    "Calçados",
    "Acessórios",
    "Costureira/Alfaiate"
  ],

  // TRANSFERÊNCIAS E OUTROS
  "Transferência": [
    "Entre contas",
    "Para terceiros",
    "Poupança",
    "Investimentos"
  ],
  "Outros": [
    "Presentes",
    "Pets",
    "Casa/Móveis",
    "Diversos",
    "Não categorizado"
  ]
};

export const DEFAULT_USER_SETTINGS = {
  categories: DEFAULT_CATEGORIES,
  notifications: {
    enableEmail: true,
    enablePush: true,
    reminderDays: 3
  },
  preferences: {
    darkMode: false,
    language: 'pt-BR',
    currency: 'BRL'
  }
};

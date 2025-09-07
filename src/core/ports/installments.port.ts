// src/core/ports/installments.port.ts

export interface InstallmentPayment {
  id: string;
  installmentId: string;
  installmentNumber: number;
  dueDate: string; // ISO 8601
  scheduledAmount: number;
  paidAmount?: number;
  paidDate?: string; // ISO 8601
  status: 'pending' | 'paid' | 'overdue';
  transactionId?: string; // Link para a transação que pagou esta parcela
}

export interface Installment {
  id: string;
  userId: string;
  name: string;
  description?: string;
  totalAmount: number;
  totalInstallments: number;
  installmentAmount: number; // Valor padrão de cada parcela
  category: string;
  subcategory?: string;
  establishment?: string;
  startDate: string; // ISO 8601 - Data da primeira parcela
  sourceWalletId: string; // Carteira de onde sairá o dinheiro
  destinationWalletId?: string; // Carteira destino (para transferências internas)
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Campos calculados
  paidInstallments: number;
  remainingInstallments: number;
  totalPaid: number;
  remainingAmount: number;
  nextDueDate?: string; // ISO 8601
  isCompleted: boolean;

  // Referência aos pagamentos
  payments: InstallmentPayment[];
}

export interface CreateInstallmentInput {
  name: string;
  description?: string;
  totalAmount: number;
  totalInstallments: number;
  category: string;
  subcategory?: string;
  establishment?: string;
  startDate: string;
  sourceWalletId: string;
  destinationWalletId?: string;
}

export interface UpdateInstallmentInput {
  name?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  establishment?: string;
  sourceWalletId?: string;
  destinationWalletId?: string;
  isActive?: boolean;
}

export interface PayInstallmentInput {
  installmentId: string;
  installmentNumber: number;
  paidAmount: number;
  paidDate: string;
  transactionId?: string;
}

export interface InstallmentSummary {
  totalActiveInstallments: number;
  totalMonthlyCommitment: number;
  upcomingPayments: InstallmentPayment[];
  overduePayments: InstallmentPayment[];
  completedThisMonth: number;
  projectedCompletionDates: Array<{
    installmentId: string;
    name: string;
    projectedDate: string;
  }>;

  // Elementos de gamificação
  gamification: {
    completionRate: number; // Percentual geral de conclusão
    streak: number; // Sequência de pagamentos em dia
    badges: InstallmentBadge[];
    points: number; // Pontos acumulados
    level: InstallmentLevel;
    achievements: InstallmentAchievement[];
  };
}

export interface InstallmentBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface InstallmentLevel {
  level: number;
  name: string;
  description: string;
  pointsRequired: number;
  pointsToNext: number;
  benefits: string[];
}

export interface InstallmentAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  isCompleted: boolean;
  completedAt?: string;
  points: number;
}

export interface IInstallmentsRepository {
  // CRUD básico
  create(userId: string, data: CreateInstallmentInput): Promise<Installment>;
  findById(id: string): Promise<Installment | null>;
  findByUserId(userId: string): Promise<Installment[]>;
  update(id: string, data: UpdateInstallmentInput): Promise<Installment | null>;
  delete(id: string): Promise<boolean>;

  // Operações de pagamento
  payInstallment(data: PayInstallmentInput): Promise<InstallmentPayment | null>;
  getInstallmentPayments(installmentId: string): Promise<InstallmentPayment[]>;

  // Consultas específicas
  findActiveInstallments(userId: string): Promise<Installment[]>;
  findUpcomingPayments(userId: string, days: number): Promise<InstallmentPayment[]>;
  findOverduePayments(userId: string): Promise<InstallmentPayment[]>;
  getInstallmentSummary(userId: string): Promise<InstallmentSummary>;

  // Projeções e análises
  projectMonthlyCommitments(userId: string, months: number): Promise<Array<{
    month: string;
    totalCommitment: number;
    installments: Array<{
      installmentId: string;
      name: string;
      amount: number;
    }>;
  }>>;
}

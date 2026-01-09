// src/core/ports/installments.port.ts

import { FamilyVisibility } from '@/lib/types';

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

  // Campos para contato PIX
  contactId?: string; // Link para PaymentContact
  pixKeyId?: string; // Chave PIX específica do contato

  // Campos para parcelamentos recorrentes
  isRecurring?: boolean; // Se é um parcelamento recorrente (como aluguel)
  recurringType?: 'monthly' | 'yearly'; // Tipo de recorrência
  endDate?: string; // Data de fim opcional (ISO 8601)
  adjustmentHistory?: Array<{
    date: string; // ISO 8601
    previousAmount: number;
    newAmount: number;
    reason?: string;
  }>; // Histórico de alterações de valor

  // Campos calculados
  paidInstallments: number;
  remainingInstallments: number;
  totalPaid: number;
  remainingAmount: number;
  nextDueDate?: string; // ISO 8601
  isCompleted: boolean;

  // Referência aos pagamentos
  payments: InstallmentPayment[];

  // Campo para visibilidade familiar
  familyVisibility?: FamilyVisibility; // Se não definido, usa configuração geral do membro
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

  // Contato PIX para pagamento
  contactId?: string;
  pixKeyId?: string;

  // Campos para parcelamentos recorrentes
  isRecurring?: boolean;
  recurringType?: 'monthly' | 'yearly';
  endDate?: string;

  // Valores customizados por parcela (soma deve ser igual ao totalAmount)
  customInstallmentAmounts?: number[];

  // Visibilidade familiar
  familyVisibility?: FamilyVisibility;
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

  // Contato PIX para pagamento
  contactId?: string;
  pixKeyId?: string;

  // Campos para parcelamentos recorrentes
  isRecurring?: boolean;
  recurringType?: 'monthly' | 'yearly';
  endDate?: string;
  installmentAmount?: number; // Para permitir ajuste de valor em recorrentes

  // Visibilidade familiar
  familyVisibility?: FamilyVisibility;
}

export interface PayInstallmentInput {
  installmentId: string;
  installmentNumber: number;
  paidAmount: number;
  paidDate: string;
  transactionId?: string;
}

export interface AdjustRecurringInstallmentInput {
  installmentId: string;
  newAmount: number;
  reason?: string;
  effectiveDate: string; // ISO 8601 - Data a partir da qual o novo valor é aplicado
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
  gamification: GamificationData;
}

export interface GamificationData {
  completionRate: number; // Percentual geral de conclusão
  streak: number; // Sequência de pagamentos em dia
  badges: InstallmentBadge[];
  points: number; // Pontos acumulados
  level: InstallmentLevel;
  achievements: InstallmentAchievement[];
  financialHealthScore: number;
  motivationalInsights: string[];
}


export interface InstallmentBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
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

  // Operações para parcelamentos recorrentes
  adjustRecurringInstallment(data: AdjustRecurringInstallmentInput): Promise<boolean>;
  findRecurringInstallments(userId: string): Promise<Installment[]>;
  findFixedInstallments(userId: string): Promise<Installment[]>; // Parcelamentos com prazo definido

  // Consultas específicas
  findActiveInstallments(userId: string): Promise<Installment[]>;
  findUpcomingPayments(userId: string, days: number): Promise<InstallmentPayment[]>;
  findOverduePayments(userId: string): Promise<InstallmentPayment[]>;
  getInstallmentSummary(userId: string): Promise<InstallmentSummary | null>;

  // Projeções e análises
  projectMonthlyCommitments(userId: string, months: number): Promise<Array<{
    month: string;
    totalCommitment: number;
    installments: Array<{
      installmentId: string;
      name: string;
      amount: number;
      isRecurring?: boolean;
    }>;
  }>>;

  // Migração e manutenção
  migrateOrphanedWalletReferences(userId: string): Promise<{
    installmentsMigrated: number;
    transactionsMigrated: number;
  }>;
}

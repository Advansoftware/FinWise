// src/core/ports/database.port.ts

import { Transaction, Wallet, Budget, Goal, UserProfile } from '@/lib/types';
import { AICreditLog } from '@/ai/ai-types';
import { IPaymentRepository } from './payment.port';
import { IReportsRepository } from './reports.port';

export interface IUserRepository {
  findById(id: string): Promise<UserProfile | null>;
  create(user: Omit<UserProfile, 'uid'>): Promise<UserProfile>;
  update(id: string, updates: Partial<UserProfile>): Promise<void>;
  delete(id: string): Promise<void>;
  updateCredits(userId: string, amount: number): Promise<void>;
}

export interface ITransactionRepository {
  findByUserId(userId: string): Promise<Transaction[]>;
  findById(id: string): Promise<Transaction | null>;
  create(transaction: Omit<Transaction, 'id'>): Promise<Transaction>;
  update(id: string, updates: Partial<Transaction>): Promise<void>;
  delete(id: string): Promise<void>;
  findByUserIdAndDateRange(userId: string, startDate: string, endDate: string): Promise<Transaction[]>;
}

export interface IWalletRepository {
  findByUserId(userId: string): Promise<Wallet[]>;
  findById(id: string): Promise<Wallet | null>;
  create(wallet: Omit<Wallet, 'id'>): Promise<Wallet>;
  update(id: string, updates: Partial<Wallet>): Promise<void>;
  delete(id: string): Promise<void>;
  updateBalance(id: string, amount: number): Promise<void>;
}

export interface IBudgetRepository {
  findByUserId(userId: string): Promise<Budget[]>;
  findById(id: string): Promise<Budget | null>;
  create(budget: Omit<Budget, 'id'>): Promise<Budget>;
  update(id: string, updates: Partial<Budget>): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IGoalRepository {
  findByUserId(userId: string): Promise<Goal[]>;
  findById(id: string): Promise<Goal | null>;
  create(goal: Omit<Goal, 'id'>): Promise<Goal>;
  update(id: string, updates: Partial<Goal>): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IAICreditLogRepository {
  findByUserId(userId: string): Promise<AICreditLog[]>;
  create(log: Omit<AICreditLog, 'id'>): Promise<AICreditLog>;
  findByUserIdAndDateRange(userId: string, startDate: string, endDate: string): Promise<AICreditLog[]>;
}

export interface ISettingsRepository {
  findByUserId(userId: string): Promise<any>;
  updateByUserId(userId: string, settings: any): Promise<void>;
}

export interface IAIGeneratedDataRepository {
  findByUserIdAndType(userId: string, type: string): Promise<any | null>;
  findLatestByUserIdAndType(userId: string, type: string): Promise<any | null>;
  findByUserIdTypeAndDate(userId: string, type: string, date: string): Promise<any | null>;
  create(data: {
    userId: string;
    type: string;
    data: any;
    generatedAt: Date;
    month: number;
    year: number;
    relatedId?: string; // Para vincular a metas específicas
  }): Promise<void>;
  replaceByUserIdAndType(userId: string, type: string, data: {
    userId: string;
    type: string;
    data: any;
    generatedAt: Date;
    month: number;
    year: number;
    relatedId?: string;
  }): Promise<void>;
  deleteOldData(beforeDate: Date): Promise<void>;
}

// Main database interface that contains all repositories
export interface IDatabaseAdapter {
  users: IUserRepository;
  transactions: ITransactionRepository;
  wallets: IWalletRepository;
  budgets: IBudgetRepository;
  goals: IGoalRepository;
  aiCreditLogs: IAICreditLogRepository;
  settings: ISettingsRepository;
  aiGeneratedData: IAIGeneratedDataRepository;
  payments: IPaymentRepository;
  reports: IReportsRepository;

  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  // Transaction support
  withTransaction<T>(operation: () => Promise<T>): Promise<T>;
}

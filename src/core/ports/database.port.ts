// src/core/ports/database.port.ts

import { Transaction, Wallet, Budget, UserProfile } from '@/lib/types';
import { AICreditLog } from '@/ai/ai-types';

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

export interface IAICreditLogRepository {
  findByUserId(userId: string): Promise<AICreditLog[]>;
  create(log: Omit<AICreditLog, 'id'>): Promise<AICreditLog>;
  findByUserIdAndDateRange(userId: string, startDate: string, endDate: string): Promise<AICreditLog[]>;
}

export interface ISettingsRepository {
  findByUserId(userId: string): Promise<any>;
  updateByUserId(userId: string, settings: any): Promise<void>;
}

// Main database interface that contains all repositories
export interface IDatabaseAdapter {
  users: IUserRepository;
  transactions: ITransactionRepository;
  wallets: IWalletRepository;
  budgets: IBudgetRepository;
  aiCreditLogs: IAICreditLogRepository;
  settings: ISettingsRepository;

  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  // Transaction support
  withTransaction<T>(operation: () => Promise<T>): Promise<T>;
}

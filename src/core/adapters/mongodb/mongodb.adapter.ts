// src/core/adapters/mongodb/mongodb.adapter.ts

import { MongoClient, Db, ObjectId, ClientSession } from 'mongodb';
import {
  IDatabaseAdapter,
  IUserRepository,
  ITransactionRepository,
  IWalletRepository,
  IBudgetRepository,
  IGoalRepository,
  IAICreditLogRepository,
  ISettingsRepository,
  IAIGeneratedDataRepository
} from '@/core/ports/database.port';
import { IPaymentRepository } from '@/core/ports/payment.port';
import { IReportsRepository } from '@/core/ports/reports.port';
import { MongoPaymentRepository } from './mongodb-payment.adapter';
import { MongoReportsRepository } from './mongodb-reports.adapter';
import { Transaction, Wallet, Budget, Goal, UserProfile } from '@/lib/types';
import { AICreditLog } from '@/ai/ai-types';

class MongoUserRepository implements IUserRepository {
  constructor(private db: Db) { }

  async findById(id: string): Promise<UserProfile | null> {
    const user = await this.db.collection('users').findOne({ _id: new ObjectId(id) });
    if (!user) return null;

    return {
      uid: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      plan: user.plan || 'Básico',
      aiCredits: user.aiCredits || 0,
      stripeCustomerId: user.stripeCustomerId,
      createdAt: user.createdAt || new Date().toISOString()
    };
  }

  async create(userData: Omit<UserProfile, 'uid'>): Promise<UserProfile> {
    const result = await this.db.collection('users').insertOne({
      ...userData,
      createdAt: userData.createdAt || new Date().toISOString()
    });

    return {
      uid: result.insertedId.toString(),
      ...userData,
      createdAt: userData.createdAt || new Date().toISOString()
    };
  }

  async update(id: string, updates: Partial<UserProfile>): Promise<void> {
    await this.db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.collection('users').deleteOne({ _id: new ObjectId(id) });
  }

  async updateCredits(userId: string, amount: number): Promise<void> {
    await this.db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { aiCredits: amount } }
    );
  }
}

class MongoTransactionRepository implements ITransactionRepository {
  constructor(private db: Db) { }

  async findByUserId(userId: string): Promise<Transaction[]> {
    const transactions = await this.db.collection('transactions')
      .find({ userId })
      .sort({ date: -1 })
      .toArray();

    return transactions.map(t => ({
      id: t._id.toString(),
      userId: t.userId,
      date: t.date,
      item: t.item,
      category: t.category,
      subcategory: t.subcategory,
      amount: t.amount,
      quantity: t.quantity,
      establishment: t.establishment,
      type: t.type,
      walletId: t.walletId,
      toWalletId: t.toWalletId
    }));
  }

  async findById(id: string): Promise<Transaction | null> {
    const transaction = await this.db.collection('transactions').findOne({ _id: new ObjectId(id) });
    if (!transaction) return null;

    return {
      id: transaction._id.toString(),
      userId: transaction.userId,
      date: transaction.date,
      item: transaction.item,
      category: transaction.category,
      subcategory: transaction.subcategory,
      amount: transaction.amount,
      quantity: transaction.quantity,
      establishment: transaction.establishment,
      type: transaction.type,
      walletId: transaction.walletId,
      toWalletId: transaction.toWalletId
    };
  }

  async create(transactionData: Omit<Transaction, 'id'>): Promise<Transaction> {
    const result = await this.db.collection('transactions').insertOne(transactionData);

    return {
      id: result.insertedId.toString(),
      ...transactionData
    };
  }

  async update(id: string, updates: Partial<Transaction>): Promise<void> {
    const { id: _, ...updateData } = updates;
    await this.db.collection('transactions').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.collection('transactions').deleteOne({ _id: new ObjectId(id) });
  }

  async findByUserIdAndDateRange(userId: string, startDate: string, endDate: string): Promise<Transaction[]> {
    const transactions = await this.db.collection('transactions')
      .find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      })
      .sort({ date: -1 })
      .toArray();

    return transactions.map(t => ({
      id: t._id.toString(),
      userId: t.userId,
      date: t.date,
      item: t.item,
      category: t.category,
      subcategory: t.subcategory,
      amount: t.amount,
      quantity: t.quantity,
      establishment: t.establishment,
      type: t.type,
      walletId: t.walletId,
      toWalletId: t.toWalletId
    }));
  }
}

class MongoWalletRepository implements IWalletRepository {
  constructor(private db: Db) { }

  async findByUserId(userId: string): Promise<Wallet[]> {
    const wallets = await this.db.collection('wallets')
      .find({ userId })
      .sort({ createdAt: 1 })
      .toArray();

    return wallets.map(w => ({
      id: w._id.toString(),
      userId: w.userId,
      name: w.name,
      type: w.type,
      balance: w.balance,
      createdAt: w.createdAt
    }));
  }

  async findById(id: string): Promise<Wallet | null> {
    const wallet = await this.db.collection('wallets').findOne({ _id: new ObjectId(id) });
    if (!wallet) return null;

    return {
      id: wallet._id.toString(),
      userId: wallet.userId,
      name: wallet.name,
      type: wallet.type,
      balance: wallet.balance,
      createdAt: wallet.createdAt
    };
  }

  async create(walletData: Omit<Wallet, 'id'>): Promise<Wallet> {
    const result = await this.db.collection('wallets').insertOne({
      ...walletData,
      createdAt: walletData.createdAt || new Date().toISOString()
    });

    return {
      id: result.insertedId.toString(),
      ...walletData,
      createdAt: walletData.createdAt || new Date().toISOString()
    };
  }

  async update(id: string, updates: Partial<Wallet>): Promise<void> {
    const { id: _, ...updateData } = updates;
    await this.db.collection('wallets').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.collection('wallets').deleteOne({ _id: new ObjectId(id) });
  }

  async updateBalance(id: string, amount: number): Promise<void> {
    await this.db.collection('wallets').updateOne(
      { _id: new ObjectId(id) },
      { $inc: { balance: amount } }
    );
  }
}

class MongoBudgetRepository implements IBudgetRepository {
  constructor(private db: Db) { }

  async findByUserId(userId: string): Promise<Budget[]> {
    const budgets = await this.db.collection('budgets')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return budgets.map(b => ({
      id: b._id.toString(),
      userId: b.userId,
      name: b.name,
      category: b.category,
      amount: b.amount,
      currentSpending: b.currentSpending || 0,
      period: b.period,
      createdAt: b.createdAt
    }));
  }

  async findById(id: string): Promise<Budget | null> {
    const budget = await this.db.collection('budgets').findOne({ _id: new ObjectId(id) });
    if (!budget) return null;

    return {
      id: budget._id.toString(),
      userId: budget.userId,
      name: budget.name,
      category: budget.category,
      amount: budget.amount,
      currentSpending: budget.currentSpending || 0,
      period: budget.period,
      createdAt: budget.createdAt
    };
  }

  async create(budgetData: Omit<Budget, 'id'>): Promise<Budget> {
    const dataWithDefaults = {
      ...budgetData,
      currentSpending: budgetData.currentSpending || 0,
      createdAt: budgetData.createdAt || new Date().toISOString()
    };

    const result = await this.db.collection('budgets').insertOne(dataWithDefaults);

    return {
      id: result.insertedId.toString(),
      ...dataWithDefaults
    };
  }

  async update(id: string, updates: Partial<Budget>): Promise<void> {
    const { id: _, ...updateData } = updates;
    await this.db.collection('budgets').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.collection('budgets').deleteOne({ _id: new ObjectId(id) });
  }
}

class MongoGoalRepository implements IGoalRepository {
  constructor(private db: Db) { }

  async findByUserId(userId: string): Promise<Goal[]> {
    const goals = await this.db.collection('goals')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return goals.map(g => ({
      id: g._id.toString(),
      userId: g.userId,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount || 0,
      targetDate: g.targetDate,
      monthlyDeposit: g.monthlyDeposit,
      createdAt: g.createdAt
    }));
  }

  async findById(id: string): Promise<Goal | null> {
    const goal = await this.db.collection('goals').findOne({ _id: new ObjectId(id) });
    if (!goal) return null;

    return {
      id: goal._id.toString(),
      userId: goal.userId,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount || 0,
      targetDate: goal.targetDate,
      monthlyDeposit: goal.monthlyDeposit,
      createdAt: goal.createdAt
    };
  }

  async create(goalData: Omit<Goal, 'id'>): Promise<Goal> {
    const dataWithDefaults = {
      ...goalData,
      currentAmount: goalData.currentAmount || 0,
      createdAt: goalData.createdAt || new Date().toISOString()
    };

    const result = await this.db.collection('goals').insertOne(dataWithDefaults);

    return {
      id: result.insertedId.toString(),
      ...dataWithDefaults
    };
  }

  async update(id: string, updates: Partial<Goal>): Promise<void> {
    const { id: _, ...updateData } = updates;
    await this.db.collection('goals').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.collection('goals').deleteOne({ _id: new ObjectId(id) });
  }
}

class MongoAICreditLogRepository implements IAICreditLogRepository {
  constructor(private db: Db) { }

  async findByUserId(userId: string): Promise<AICreditLog[]> {
    const logs = await this.db.collection('aiCreditLogs')
      .find({ userId })
      .sort({ timestamp: -1 })
      .toArray();

    return logs.map(l => ({
      id: l._id.toString(),
      userId: l.userId,
      action: l.action,
      cost: l.cost,
      timestamp: l.timestamp
    }));
  }

  async create(logData: Omit<AICreditLog, 'id'>): Promise<AICreditLog> {
    const result = await this.db.collection('aiCreditLogs').insertOne(logData);

    return {
      id: result.insertedId.toString(),
      ...logData
    };
  }

  async findByUserIdAndDateRange(userId: string, startDate: string, endDate: string): Promise<AICreditLog[]> {
    const logs = await this.db.collection('aiCreditLogs')
      .find({
        userId,
        timestamp: { $gte: startDate, $lte: endDate }
      })
      .sort({ timestamp: -1 })
      .toArray();

    return logs.map(l => ({
      id: l._id.toString(),
      userId: l.userId,
      action: l.action,
      cost: l.cost,
      timestamp: l.timestamp
    }));
  }
}

class MongoSettingsRepository implements ISettingsRepository {
  constructor(private db: Db) { }

  async findByUserId(userId: string): Promise<any> {
    const settings = await this.db.collection('settings').findOne({ userId });
    return settings?.data || null;
  }

  async updateByUserId(userId: string, settings: any): Promise<void> {
    await this.db.collection('settings').updateOne(
      { userId },
      { $set: { userId, data: settings } },
      { upsert: true }
    );
  }
}

class MongoAIGeneratedDataRepository implements IAIGeneratedDataRepository {
  constructor(private db: Db) { }

  async findByUserIdAndType(userId: string, type: string): Promise<any | null> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const result = await this.db.collection('ai_generated_data').findOne({
      userId,
      type,
      month: currentMonth,
      year: currentYear
    });

    return result?.data || null;
  }

  async findLatestByUserIdAndType(userId: string, type: string): Promise<any | null> {
    const result = await this.db.collection('ai_generated_data')
      .findOne(
        { userId, type },
        { sort: { generatedAt: -1 } }
      );

    return result?.data || null;
  }

  async findByUserIdTypeAndDate(userId: string, type: string, date: string): Promise<any | null> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

    const result = await this.db.collection('ai_generated_data').findOne({
      userId,
      type,
      generatedAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    return result?.data || null;
  }

  async create(data: {
    userId: string;
    type: string;
    data: any;
    generatedAt: Date;
    month: number;
    year: number;
    relatedId?: string;
  }): Promise<void> {
    await this.db.collection('ai_generated_data').insertOne(data);
  }

  async replaceByUserIdAndType(userId: string, type: string, data: {
    userId: string;
    type: string;
    data: any;
    generatedAt: Date;
    month: number;
    year: number;
    relatedId?: string;
  }): Promise<void> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    await this.db.collection('ai_generated_data').replaceOne(
      {
        userId,
        type,
        month: currentMonth,
        year: currentYear
      },
      data,
      { upsert: true }
    );
  }

  async deleteOldData(beforeDate: Date): Promise<void> {
    await this.db.collection('ai_generated_data').deleteMany({
      generatedAt: { $lt: beforeDate }
    });
  }
}

export class MongoDBAdapter implements IDatabaseAdapter {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  public users!: IUserRepository;
  public transactions!: ITransactionRepository;
  public wallets!: IWalletRepository;
  public budgets!: IBudgetRepository;
  public goals!: IGoalRepository;
  public aiCreditLogs!: IAICreditLogRepository;
  public settings!: ISettingsRepository;
  public aiGeneratedData!: IAIGeneratedDataRepository;
  public payments!: IPaymentRepository;
  public reports!: IReportsRepository;

  async connect(): Promise<void> {
    if (this.client && this.db) {
      return; // Already connected
    }

    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'gastometria';

    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    console.log('🔧 Connecting to MongoDB...');
    this.client = new MongoClient(uri);
    await this.client.connect();
    this.db = this.client.db(dbName);

    // Initialize repositories
    this.users = new MongoUserRepository(this.db);
    this.transactions = new MongoTransactionRepository(this.db);
    this.wallets = new MongoWalletRepository(this.db);
    this.budgets = new MongoBudgetRepository(this.db);
    this.goals = new MongoGoalRepository(this.db);
    this.aiCreditLogs = new MongoAICreditLogRepository(this.db);
    this.settings = new MongoSettingsRepository(this.db);
    this.aiGeneratedData = new MongoAIGeneratedDataRepository(this.db);
    this.payments = new MongoPaymentRepository(this.db);
    this.reports = new MongoReportsRepository(this.db);

    console.log('✅ MongoDB connected and repositories initialized');
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  async withTransaction<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const session = this.client.startSession();

    try {
      return await session.withTransaction(async () => {
        return await operation();
      });
    } finally {
      await session.endSession();
    }
  }
}

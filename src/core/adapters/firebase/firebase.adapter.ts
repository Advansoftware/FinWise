// src/core/adapters/firebase/firebase.adapter.ts

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction,
  Timestamp,
  increment
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import {
  IDatabaseAdapter,
  IUserRepository,
  ITransactionRepository,
  IWalletRepository,
  IBudgetRepository,
  IAICreditLogRepository,
  ISettingsRepository
} from '@/core/ports/database.port';
import { Transaction, Wallet, Budget, UserProfile } from '@/lib/types';
import { AICreditLog } from '@/ai/ai-types';

class FirebaseUserRepository implements IUserRepository {
  private db = getFirestore(getApp());

  async findById(id: string): Promise<UserProfile | null> {
    const docRef = doc(this.db, 'users', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      uid: docSnap.id,
      email: data.email,
      displayName: data.displayName,
      plan: data.plan || 'Básico',
      aiCredits: data.aiCredits || 0,
      stripeCustomerId: data.stripeCustomerId,
      createdAt: data.createdAt
    };
  }

  async create(userData: Omit<UserProfile, 'uid'>): Promise<UserProfile> {
    const docRef = await addDoc(collection(this.db, 'users'), {
      ...userData,
      createdAt: userData.createdAt || new Date().toISOString()
    });

    return {
      uid: docRef.id,
      ...userData,
      createdAt: userData.createdAt || new Date().toISOString()
    };
  }

  async update(id: string, updates: Partial<UserProfile>): Promise<void> {
    const docRef = doc(this.db, 'users', id);
    await updateDoc(docRef, updates);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.db, 'users', id);
    await deleteDoc(docRef);
  }

  async updateCredits(userId: string, amount: number): Promise<void> {
    const docRef = doc(this.db, 'users', userId);
    await updateDoc(docRef, {
      aiCredits: increment(amount)
    });
  }
}

class FirebaseTransactionRepository implements ITransactionRepository {
  private db = getFirestore(getApp());

  async findByUserId(userId: string): Promise<Transaction[]> {
    const q = query(
      collection(this.db, 'transactions'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        userId: data.userId,
        date: data.date,
        item: data.item,
        category: data.category,
        subcategory: data.subcategory,
        amount: data.amount,
        quantity: data.quantity,
        establishment: data.establishment,
        type: data.type,
        walletId: data.walletId,
        toWalletId: data.toWalletId
      });
    });

    return transactions;
  }

  async findById(id: string): Promise<Transaction | null> {
    const docRef = doc(this.db, 'transactions', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId: data.userId,
      date: data.date,
      item: data.item,
      category: data.category,
      subcategory: data.subcategory,
      amount: data.amount,
      quantity: data.quantity,
      establishment: data.establishment,
      type: data.type,
      walletId: data.walletId,
      toWalletId: data.toWalletId
    };
  }

  async create(transactionData: Omit<Transaction, 'id'>): Promise<Transaction> {
    const docRef = await addDoc(collection(this.db, 'transactions'), transactionData);

    return {
      id: docRef.id,
      ...transactionData
    };
  }

  async update(id: string, updates: Partial<Transaction>): Promise<void> {
    const { id: _, ...updateData } = updates;
    const docRef = doc(this.db, 'transactions', id);
    await updateDoc(docRef, updateData);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.db, 'transactions', id);
    await deleteDoc(docRef);
  }

  async findByUserIdAndDateRange(userId: string, startDate: string, endDate: string): Promise<Transaction[]> {
    const q = query(
      collection(this.db, 'transactions'),
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        userId: data.userId,
        date: data.date,
        item: data.item,
        category: data.category,
        subcategory: data.subcategory,
        amount: data.amount,
        quantity: data.quantity,
        establishment: data.establishment,
        type: data.type,
        walletId: data.walletId,
        toWalletId: data.toWalletId
      });
    });

    return transactions;
  }
}

class FirebaseWalletRepository implements IWalletRepository {
  private db = getFirestore(getApp());

  async findByUserId(userId: string): Promise<Wallet[]> {
    const q = query(
      collection(this.db, 'wallets'),
      where('userId', '==', userId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const wallets: Wallet[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      wallets.push({
        id: doc.id,
        userId: data.userId,
        name: data.name,
        type: data.type,
        balance: data.balance,
        createdAt: data.createdAt
      });
    });

    return wallets;
  }

  async findById(id: string): Promise<Wallet | null> {
    const docRef = doc(this.db, 'wallets', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId: data.userId,
      name: data.name,
      type: data.type,
      balance: data.balance,
      createdAt: data.createdAt
    };
  }

  async create(walletData: Omit<Wallet, 'id'>): Promise<Wallet> {
    const dataWithDefaults = {
      ...walletData,
      createdAt: walletData.createdAt || new Date().toISOString()
    };

    const docRef = await addDoc(collection(this.db, 'wallets'), dataWithDefaults);

    return {
      id: docRef.id,
      ...dataWithDefaults
    };
  }

  async update(id: string, updates: Partial<Wallet>): Promise<void> {
    const { id: _, ...updateData } = updates;
    const docRef = doc(this.db, 'wallets', id);
    await updateDoc(docRef, updateData);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.db, 'wallets', id);
    await deleteDoc(docRef);
  }

  async updateBalance(id: string, amount: number): Promise<void> {
    const docRef = doc(this.db, 'wallets', id);
    await updateDoc(docRef, {
      balance: increment(amount)
    });
  }
}

class FirebaseBudgetRepository implements IBudgetRepository {
  private db = getFirestore(getApp());

  async findByUserId(userId: string): Promise<Budget[]> {
    const q = query(
      collection(this.db, 'budgets'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const budgets: Budget[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      budgets.push({
        id: doc.id,
        userId: data.userId,
        name: data.name,
        category: data.category,
        amount: data.amount,
        currentSpending: data.currentSpending || 0,
        period: data.period,
        createdAt: data.createdAt
      });
    });

    return budgets;
  }

  async findById(id: string): Promise<Budget | null> {
    const docRef = doc(this.db, 'budgets', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId: data.userId,
      name: data.name,
      category: data.category,
      amount: data.amount,
      currentSpending: data.currentSpending || 0,
      period: data.period,
      createdAt: data.createdAt
    };
  }

  async create(budgetData: Omit<Budget, 'id'>): Promise<Budget> {
    const dataWithDefaults = {
      ...budgetData,
      currentSpending: budgetData.currentSpending || 0,
      createdAt: budgetData.createdAt || new Date().toISOString()
    };

    const docRef = await addDoc(collection(this.db, 'budgets'), dataWithDefaults);

    return {
      id: docRef.id,
      ...dataWithDefaults
    };
  }

  async update(id: string, updates: Partial<Budget>): Promise<void> {
    const { id: _, ...updateData } = updates;
    const docRef = doc(this.db, 'budgets', id);
    await updateDoc(docRef, updateData);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.db, 'budgets', id);
    await deleteDoc(docRef);
  }
}

class FirebaseAICreditLogRepository implements IAICreditLogRepository {
  private db = getFirestore(getApp());

  async findByUserId(userId: string): Promise<AICreditLog[]> {
    const q = query(
      collection(this.db, 'aiCreditLogs'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const logs: AICreditLog[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        userId: data.userId,
        action: data.action,
        cost: data.cost,
        timestamp: data.timestamp
      });
    });

    return logs;
  }

  async create(logData: Omit<AICreditLog, 'id'>): Promise<AICreditLog> {
    const docRef = await addDoc(collection(this.db, 'aiCreditLogs'), logData);

    return {
      id: docRef.id,
      ...logData
    };
  }

  async findByUserIdAndDateRange(userId: string, startDate: string, endDate: string): Promise<AICreditLog[]> {
    const q = query(
      collection(this.db, 'aiCreditLogs'),
      where('userId', '==', userId),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const logs: AICreditLog[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        userId: data.userId,
        action: data.action,
        cost: data.cost,
        timestamp: data.timestamp
      });
    });

    return logs;
  }
}

class FirebaseSettingsRepository implements ISettingsRepository {
  private db = getFirestore(getApp());

  async findByUserId(userId: string): Promise<any> {
    const docRef = doc(this.db, 'users', userId, 'settings', 'ai');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return docSnap.data();
  }

  async updateByUserId(userId: string, settings: any): Promise<void> {
    const docRef = doc(this.db, 'users', userId, 'settings', 'ai');
    await updateDoc(docRef, settings);
  }
}

export class FirebaseAdapter implements IDatabaseAdapter {
  private db = getFirestore(getApp());

  public users: IUserRepository;
  public transactions: ITransactionRepository;
  public wallets: IWalletRepository;
  public budgets: IBudgetRepository;
  public aiCreditLogs: IAICreditLogRepository;
  public settings: ISettingsRepository;

  constructor() {
    this.users = new FirebaseUserRepository();
    this.transactions = new FirebaseTransactionRepository();
    this.wallets = new FirebaseWalletRepository();
    this.budgets = new FirebaseBudgetRepository();
    this.aiCreditLogs = new FirebaseAICreditLogRepository();
    this.settings = new FirebaseSettingsRepository();
  }

  async connect(): Promise<void> {
    // Firebase connection is handled by the Firebase SDK
    // No explicit connection needed
  }

  async disconnect(): Promise<void> {
    // Firebase doesn't require explicit disconnection
    // Connection is managed by the SDK
  }

  async withTransaction<T>(operation: () => Promise<T>): Promise<T> {
    return await runTransaction(this.db, async (transaction) => {
      return await operation();
    });
  }
}

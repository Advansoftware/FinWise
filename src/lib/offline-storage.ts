// src/lib/offline-storage.ts
import { openDB } from 'idb';
import { Transaction } from './types';

class OfflineStorage {
  private db: any = null;
  private readonly DB_NAME = 'gastometria-db';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade(db: any) {
        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionStore = db.createObjectStore('transactions', {
            keyPath: 'id',
          });
          transactionStore.createIndex('userId', 'userId');
          transactionStore.createIndex('synced', 'synced');
        }

        // Pending actions store
        if (!db.objectStoreNames.contains('pendingActions')) {
          const pendingStore = db.createObjectStore('pendingActions', {
            keyPath: 'id',
          });
          pendingStore.createIndex('type', 'type');
          pendingStore.createIndex('timestamp', 'timestamp');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', {
            keyPath: 'key',
          });
        }
      },
    });
  }

  // Transactions
  async saveTransaction(transaction: Transaction, synced: boolean = true): Promise<void> {
    await this.init();
    if (!this.db) return;

    await this.db.put('transactions', { ...transaction, synced });
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    await this.init();
    if (!this.db) return [];

    const transactions = await this.db.getAllFromIndex('transactions', 'userId', userId);
    return transactions.map(({ synced, ...transaction }: any) => transaction);
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    await this.db.delete('transactions', transactionId);
  }

  // Pending Actions
  async addPendingAction(action: {
    type: 'create' | 'update' | 'delete';
    data: any;
  }): Promise<void> {
    await this.init();
    if (!this.db) return;

    const id = `${action.type}-${Date.now()}-${Math.random()}`;
    await this.db.put('pendingActions', {
      id,
      ...action,
      timestamp: Date.now(),
    });
  }

  async getPendingActions(): Promise<Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    data: any;
    timestamp: number;
  }>> {
    await this.init();
    if (!this.db) return [];

    return await this.db.getAll('pendingActions');
  }

  async removePendingAction(actionId: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    await this.db.delete('pendingActions', actionId);
  }

  async clearPendingActions(): Promise<void> {
    await this.init();
    if (!this.db) return;

    const tx = this.db.transaction('pendingActions', 'readwrite');
    await tx.store.clear();
    await tx.done;
  }

  // Settings
  async saveSetting(key: string, value: any): Promise<void> {
    await this.init();
    if (!this.db) return;

    await this.db.put('settings', { key, value });
  }

  async getSetting(key: string): Promise<any> {
    await this.init();
    if (!this.db) return null;

    const result = await this.db.get('settings', key);
    return result?.value;
  }

  // Sync helpers
  async getUnsyncedTransactions(): Promise<Array<Transaction & { synced: boolean }>> {
    await this.init();
    if (!this.db) return [];

    return await this.db.getAllFromIndex('transactions', 'synced', false);
  }

  async markTransactionSynced(transactionId: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    const transaction = await this.db.get('transactions', transactionId);
    if (transaction) {
      transaction.synced = true;
      await this.db.put('transactions', transaction);
    }
  }

  // Clear all data (useful for logout)
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) return;

    const tx = this.db.transaction(['transactions', 'pendingActions', 'settings'], 'readwrite');
    await Promise.all([
      tx.objectStore('transactions').clear(),
      tx.objectStore('pendingActions').clear(),
      tx.objectStore('settings').clear(),
    ]);
    await tx.done;
  }

  // Network status helpers
  async syncWhenOnline(): Promise<void> {
    if (!navigator.onLine) return;

    const pendingActions = await this.getPendingActions();

    for (const action of pendingActions) {
      try {
        // Aqui você faria a sincronização com o servidor
        console.log('Syncing action:', action);

        // Remover da lista de pendentes após sucesso
        await this.removePendingAction(action.id);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
      }
    }
  }
}

export const offlineStorage = new OfflineStorage();

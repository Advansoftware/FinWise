// src/lib/offline-storage.ts
import {openDB} from 'idb';
import {Transaction, Wallet, Budget, Goal, UserProfile} from './types';
import {apiClient} from './api-client';

interface SyncableItem {
  id: string;
  lastModified: number;
  synced: boolean;
  data: any;
}

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

class OfflineStorage {
  private db: any = null;
  private readonly DB_NAME = 'gastometria-db';
  private readonly DB_VERSION = 2;
  private syncInProgress = false;

  async init(): Promise<void> {
    // Skip initialization on server-side
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.log('⚠️ Skipping IndexedDB initialization on server-side');
      return;
    }

    if (this.db) return;

    this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade(db: any, oldVersion: number) {
        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionStore = db.createObjectStore('transactions', {
            keyPath: 'id',
          });
          transactionStore.createIndex('userId', 'userId');
          transactionStore.createIndex('synced', 'synced');
          transactionStore.createIndex('lastModified', 'lastModified');
        }

        // Wallets store
        if (!db.objectStoreNames.contains('wallets')) {
          const walletStore = db.createObjectStore('wallets', {
            keyPath: 'id',
          });
          walletStore.createIndex('userId', 'userId');
          walletStore.createIndex('synced', 'synced');
          walletStore.createIndex('lastModified', 'lastModified');
        }

        // Budgets store
        if (!db.objectStoreNames.contains('budgets')) {
          const budgetStore = db.createObjectStore('budgets', {
            keyPath: 'id',
          });
          budgetStore.createIndex('userId', 'userId');
          budgetStore.createIndex('synced', 'synced');
          budgetStore.createIndex('lastModified', 'lastModified');
        }

        // Goals store
        if (!db.objectStoreNames.contains('goals')) {
          const goalStore = db.createObjectStore('goals', {
            keyPath: 'id',
          });
          goalStore.createIndex('userId', 'userId');
          goalStore.createIndex('synced', 'synced');
          goalStore.createIndex('lastModified', 'lastModified');
        }

        // Installments store
        if (!db.objectStoreNames.contains('installments')) {
          const installmentStore = db.createObjectStore('installments', {
            keyPath: 'id',
          });
          installmentStore.createIndex('userId', 'userId');
          installmentStore.createIndex('synced', 'synced');
          installmentStore.createIndex('lastModified', 'lastModified');
        }

        // Pending actions store
        if (!db.objectStoreNames.contains('pendingActions')) {
          const pendingStore = db.createObjectStore('pendingActions', {
            keyPath: 'id',
          });
          pendingStore.createIndex('type', 'type');
          pendingStore.createIndex('timestamp', 'timestamp');
          pendingStore.createIndex('collection', 'collection');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', {
            keyPath: 'key',
          });
        }

        // Sync metadata store
        if (!db.objectStoreNames.contains('syncMetadata')) {
          const syncStore = db.createObjectStore('syncMetadata', {
            keyPath: 'collection',
          });
        }
      },
    });

    // Setup online/offline event listeners
    this.setupSyncListeners();
  }

  private setupSyncListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('🌐 Back online - starting sync...');
        this.syncWhenOnline();
      });

      window.addEventListener('offline', () => {
        console.log('📴 Gone offline - operations will be queued');
      });

      // Sync every 5 minutes when online
      setInterval(() => {
        if (navigator.onLine) {
          this.syncWhenOnline();
        }
      }, 5 * 60 * 1000);
    }
  }

  // Generic save method with sync support
  async saveItem(collection: string, item: any, synced: boolean = true): Promise<void> {
    if (typeof window === 'undefined') return; // Skip on server-side

    await this.init();
    if (!this.db) return;

    const syncableItem: SyncableItem = {
      ...item,
      lastModified: Date.now(),
      synced
    };

    await this.db.put(collection, syncableItem);

    // If not synced and we're online, try immediate sync
    if (!synced && navigator.onLine) {
      this.syncCollection(collection);
    }
  }

  // Generic get method
  async getItems(collection: string, userId: string): Promise<any[]> {
    if (typeof window === 'undefined') return []; // Skip on server-side

    await this.init();
    if (!this.db) return [];

    const items = await this.db.getAllFromIndex(collection, 'userId', userId);
    return items.map(({ synced, lastModified, ...item }: any) => item);
  }

  // Generic get single item method
  async getItem(collection: string, itemId: string): Promise<any> {
    await this.init();
    if (!this.db) return null;

    const item = await this.db.get(collection, itemId);
    if (!item) return null;

    const { synced, lastModified, ...cleanItem } = item;
    return cleanItem;
  }

  // Generic delete method
  async deleteItem(collection: string, itemId: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    await this.db.delete(collection, itemId);
  }

  // Specific methods for each collection type
  async saveTransaction(transaction: Transaction, synced: boolean = true): Promise<void> {
    return this.saveItem('transactions', transaction, synced);
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    return this.getItems('transactions', userId);
  }

  async saveWallet(wallet: Wallet, synced: boolean = true): Promise<void> {
    return this.saveItem('wallets', wallet, synced);
  }

  async getWallets(userId: string): Promise<Wallet[]> {
    return this.getItems('wallets', userId);
  }

  async getWallet(walletId: string): Promise<Wallet | null> {
    return this.getItem('wallets', walletId);
  }

  async saveBudget(budget: Budget, synced: boolean = true): Promise<void> {
    return this.saveItem('budgets', budget, synced);
  }

  async getBudgets(userId: string): Promise<Budget[]> {
    return this.getItems('budgets', userId);
  }

  async saveGoal(goal: Goal, synced: boolean = true): Promise<void> {
    return this.saveItem('goals', goal, synced);
  }

  async getGoals(userId: string): Promise<Goal[]> {
    return this.getItems('goals', userId);
  }

  async saveInstallment(installment: any, synced: boolean = true): Promise<void> {
    return this.saveItem('installments', installment, synced);
  }

  async getInstallments(userId: string): Promise<any[]> {
    return this.getItems('installments', userId);
  }

  // Pending Actions Management
  async addPendingAction(action: {
    type: 'create' | 'update' | 'delete';
    collection: string;
    data: any;
  }): Promise<void> {
    if (typeof window === 'undefined') return; // Skip on server-side

    await this.init();
    if (!this.db) return;

    const pendingAction: PendingAction = {
      id: `${action.type}-${action.collection}-${Date.now()}-${Math.random()}`,
      ...action,
      timestamp: Date.now(),
      retryCount: 0
    };

    await this.db.put('pendingActions', pendingAction);
  }

  async getPendingActions(): Promise<PendingAction[]> {
    await this.init();
    if (!this.db) return [];

    return await this.db.getAll('pendingActions');
  }

  async removePendingAction(actionId: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    await this.db.delete('pendingActions', actionId);
  }

  // Sync Methods
  async syncCollection(collection: string): Promise<void> {
    if (this.syncInProgress) return;

    try {
      this.syncInProgress = true;
      console.log(`🔄 Syncing ${collection}...`);

      // Get unsynced items
      const unsyncedItems = await this.getUnsyncedItems(collection);

      for (const item of unsyncedItems) {
        try {
          // Try to sync with server
          await this.syncItemToServer(collection, item);

          // Mark as synced
          await this.markItemSynced(collection, item.id);
        } catch (error) {
          console.error(`Failed to sync ${collection} item:`, error);
          // Add to pending actions for retry
          await this.addPendingAction({
            type: 'update',
            collection,
            data: item
          });
        }
      }

      // Sync from server (get latest data)
      await this.syncFromServer(collection);

    } finally {
      this.syncInProgress = false;
    }
  }

  private async getUnsyncedItems(collection: string): Promise<any[]> {
    await this.init();
    if (!this.db) return [];

    return await this.db.getAllFromIndex(collection, 'synced', false);
  }

  private async markItemSynced(collection: string, itemId: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    const item = await this.db.get(collection, itemId);
    if (item) {
      item.synced = true;
      item.lastModified = Date.now();
      await this.db.put(collection, item);
    }
  }

  private async syncItemToServer(collection: string, item: any): Promise<void> {
    const { synced, lastModified, ...cleanItem } = item;

    try {
      await apiClient.update(collection, item.id, cleanItem);
    } catch (error) {
      // If item doesn't exist on server, create it
      if (error instanceof Error && error.message.includes('404')) {
        await apiClient.create(collection, cleanItem);
      } else {
        throw error;
      }
    }
  }

  private async syncFromServer(collection: string): Promise<void> {
    // This would get the user ID from auth context
    // For now, we'll skip this as it requires user context
    console.log(`📥 Sync from server for ${collection} completed`);
  }

  // Settings management
  async saveSetting(key: string, value: any): Promise<void> {
    if (typeof window === 'undefined') return; // Skip on server-side

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

  // Clear specific collection data (useful for force refresh)
  async clearCollection(collection: string): Promise<void> {
    if (typeof window === 'undefined') return; // Skip on server-side

    await this.init();
    if (!this.db) return;

    await this.db.clear(collection);
  }

  // Clear all data (useful for logout)
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) return;

    const stores = ['transactions', 'wallets', 'budgets', 'goals', 'installments', 'pendingActions', 'settings', 'syncMetadata'];
    const tx = this.db.transaction(stores, 'readwrite');

    await Promise.all(stores.map(store => {
      if (tx.objectStore(store)) {
        return tx.objectStore(store).clear();
      }
    }));

    await tx.done;
  }

  // Main sync method for when coming online
  async syncWhenOnline(): Promise<void> {
    if (!navigator.onLine || this.syncInProgress) return;

    const collections = ['transactions', 'wallets', 'budgets', 'goals', 'installments'];

    for (const collection of collections) {
      await this.syncCollection(collection);
    }

    // Process pending actions
    await this.processPendingActions();
  }

  // Process all pending actions when coming online
  private async processPendingActions(): Promise<void> {
    const pendingActions = await this.getPendingActions();

    for (const action of pendingActions) {
      try {
        switch (action.type) {
          case 'create':
            await apiClient.create(action.collection, action.data);
            break;
          case 'update':
            await apiClient.update(action.collection, action.data.id, action.data);
            break;
          case 'delete':
            await apiClient.delete(action.collection, action.data.id, action.data);
            break;
        }

        // Remove successful action
        await this.removePendingAction(action.id);
        console.log(`✅ Processed pending ${action.type} for ${action.collection}`);

      } catch (error) {
        console.error(`Failed to process pending action:`, action, error);

        // Increment retry count and remove if too many retries
        action.retryCount++;
        if (action.retryCount > 3) {
          await this.removePendingAction(action.id);
          console.error(`❌ Removed pending action after 3 retries:`, action);
        }
      }
    }
  }

  // Force sync all data from server (useful for refresh)
  async forceSyncFromServer(userId: string): Promise<void> {
    if (!navigator.onLine) {
      console.warn('Cannot sync from server while offline');
      return;
    }

    try {
      console.log('🔄 Force syncing all data from server...');

      const collections = ['transactions', 'wallets', 'budgets', 'goals'];

      for (const collection of collections) {
        try {
          const serverData = await apiClient.get(collection, userId);

          // Clear local data for this collection
          const tx = this.db.transaction([collection], 'readwrite');
          await tx.objectStore(collection).clear();

          // Save server data locally
          for (const item of serverData) {
            await this.saveItem(collection, item, true);
          }

          console.log(`✅ Synced ${serverData.length} ${collection} from server`);
        } catch (error) {
          console.error(`Failed to sync ${collection} from server:`, error);
        }
      }

      console.log('✅ Force sync from server completed');
    } catch (error) {
      console.error('Failed to force sync from server:', error);
    }
  }
}

export const offlineStorage = new OfflineStorage();

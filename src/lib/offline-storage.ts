// src/lib/offline-storage.ts
/**
 * Sistema de armazenamento offline-first inteligente
 * 
 * Arquitetura:
 * 1. Todos os dados são salvos PRIMEIRO no IndexedDB local
 * 2. A sincronização com o servidor acontece em segundo plano
 * 3. O app funciona 100% offline
 * 4. Quando online, sincroniza automaticamente com o MongoDB
 * 5. Sistema de detecção de conflitos e resolução
 */

import { openDB, IDBPDatabase } from 'idb';
import { Transaction, Wallet, Budget, Goal } from './types';

// Tipos para itens sincronizáveis
interface SyncableItem {
  id: string;
  userId: string;
  _localUpdatedAt: number;    // Timestamp da última modificação local
  _serverUpdatedAt?: number;  // Timestamp da última sincronização com servidor
  _syncStatus: 'synced' | 'pending' | 'conflict';
  _deleted?: boolean;         // Soft delete para sincronização
  [key: string]: any;
}

// Exporta para uso externo
export interface PendingOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  collection: string;
  itemId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  error?: string;
}

interface SyncMetadata {
  collection: string;
  lastSyncTimestamp: number;
  lastServerTimestamp?: number;
}

type CollectionName = 'transactions' | 'wallets' | 'budgets' | 'goals' | 'installments' | 'settings' | 'categories';

class OfflineStorageManager {
  private db: IDBPDatabase | null = null;
  private readonly DB_NAME = 'gastometria-offline-db';
  private readonly DB_VERSION = 3;
  private syncInProgress = false;
  private syncListenersSetup = false;
  private backgroundSyncInterval: NodeJS.Timeout | null = null;
  private changeListeners: Map<string, Set<() => void>> = new Map();

  /**
   * Inicializa o banco de dados IndexedDB
   */
  async init(): Promise<void> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.log('⚠️ IndexedDB não disponível (server-side)');
      return;
    }

    if (this.db) return;

    try {
      this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
        upgrade(db, oldVersion, newVersion) {
          console.log(`📦 Atualizando DB de v${oldVersion} para v${newVersion}`);

          // Coleções de dados
          const collections: CollectionName[] = ['transactions', 'wallets', 'budgets', 'goals', 'installments', 'categories'];

          for (const collection of collections) {
            if (!db.objectStoreNames.contains(collection)) {
              const store = db.createObjectStore(collection, { keyPath: 'id' });
              store.createIndex('userId', 'userId', { unique: false });
              store.createIndex('_syncStatus', '_syncStatus', { unique: false });
              store.createIndex('_localUpdatedAt', '_localUpdatedAt', { unique: false });
              store.createIndex('userId_syncStatus', ['userId', '_syncStatus'], { unique: false });
            }
          }

          // Store de operações pendentes
          if (!db.objectStoreNames.contains('pendingOperations')) {
            const pendingStore = db.createObjectStore('pendingOperations', { keyPath: 'id' });
            pendingStore.createIndex('collection', 'collection', { unique: false });
            pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          // Store de metadados de sincronização
          if (!db.objectStoreNames.contains('syncMetadata')) {
            db.createObjectStore('syncMetadata', { keyPath: 'collection' });
          }

          // Store de configurações do usuário
          if (!db.objectStoreNames.contains('userSettings')) {
            db.createObjectStore('userSettings', { keyPath: 'key' });
          }
        },
      });

      console.log('✅ IndexedDB inicializado com sucesso');
      this.setupSyncListeners();
      this.startBackgroundSync();
    } catch (error) {
      console.error('❌ Erro ao inicializar IndexedDB:', error);
    }
  }

  /**
   * Configura listeners para eventos online/offline
   */
  private setupSyncListeners(): void {
    if (this.syncListenersSetup || typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('🌐 Conectado - iniciando sincronização...');
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Offline - operações serão enfileiradas');
    });

    // Sincronizar quando a página ganha foco
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.syncAll();
      }
    });

    this.syncListenersSetup = true;
  }

  /**
   * Inicia sincronização em segundo plano
   */
  private startBackgroundSync(): void {
    if (this.backgroundSyncInterval) return;

    // Sincronizar a cada 30 segundos quando online
    this.backgroundSyncInterval = setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.syncAll();
      }
    }, 30 * 1000);
  }

  /**
   * Para a sincronização em segundo plano
   */
  stopBackgroundSync(): void {
    if (this.backgroundSyncInterval) {
      clearInterval(this.backgroundSyncInterval);
      this.backgroundSyncInterval = null;
    }
  }

  // ==================== CRUD OPERATIONS (Offline-First) ====================

  /**
   * Salva um item localmente (offline-first)
   * O item é salvo imediatamente no IndexedDB e a sincronização acontece em segundo plano
   */
  async saveItem<T extends { id: string; userId: string }>(
    collection: CollectionName,
    item: T,
    options: { skipSync?: boolean } = {}
  ): Promise<T> {
    await this.init();
    if (!this.db) throw new Error('Database não inicializado');

    const now = Date.now();
    const existingItem = await this.db.get(collection, item.id);

    const syncableItem: SyncableItem = {
      ...item,
      _localUpdatedAt: now,
      _serverUpdatedAt: existingItem?._serverUpdatedAt,
      _syncStatus: 'pending',
    };

    // Salva localmente
    await this.db.put(collection, syncableItem);

    // Adiciona operação pendente para sincronização
    if (!options.skipSync) {
      await this.addPendingOperation(
        existingItem ? 'update' : 'create',
        collection,
        item.id,
        item
      );

      // Tenta sincronizar imediatamente se online
      if (navigator.onLine) {
        this.syncCollection(collection, item.userId);
      }
    }

    // Notifica listeners
    this.notifyChange(collection);

    return item;
  }

  /**
   * Obtém todos os itens de uma coleção para um usuário
   * Sempre retorna dados do IndexedDB local (offline-first)
   */
  async getItems<T>(collection: CollectionName, userId: string): Promise<T[]> {
    await this.init();
    if (!this.db) return [];

    try {
      const index = this.db.transaction(collection).store.index('userId');
      const items = await index.getAll(userId);

      // Filtra itens deletados e remove metadados internos
      return items
        .filter((item: SyncableItem) => !item._deleted)
        .map((item: SyncableItem) => this.cleanItem<T>(item));
    } catch (error) {
      console.error(`Erro ao buscar ${collection}:`, error);
      return [];
    }
  }

  /**
   * Obtém um item específico
   */
  async getItem<T>(collection: CollectionName, itemId: string): Promise<T | null> {
    await this.init();
    if (!this.db) return null;

    try {
      const item = await this.db.get(collection, itemId);
      if (!item || item._deleted) return null;
      return this.cleanItem<T>(item);
    } catch (error) {
      console.error(`Erro ao buscar item ${itemId}:`, error);
      return null;
    }
  }

  /**
   * Deleta um item (soft delete para sincronização)
   * @param userId - Obrigatório para vincular ao usuário
   */
  async deleteItem(collection: CollectionName, itemId: string, userId: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    const item = await this.db.get(collection, itemId);
    if (!item) return;

    // Soft delete - marca como deletado para sincronização
    const deletedItem: SyncableItem = {
      ...item,
      _deleted: true,
      _localUpdatedAt: Date.now(),
      _syncStatus: 'pending',
    };

    await this.db.put(collection, deletedItem);

    // Adiciona operação pendente
    await this.addPendingOperation('delete', collection, itemId, { userId });

    // Tenta sincronizar se online
    if (navigator.onLine) {
      this.syncCollection(collection, userId);
    }

    // Notifica listeners
    this.notifyChange(collection);
  }

  // ==================== SYNC OPERATIONS ====================

  /**
   * Adiciona uma operação pendente (público para compatibilidade com hooks existentes)
   * @deprecated Use saveItem/deleteItem diretamente - eles já adicionam operações pendentes
   */
  async addPendingAction(action: {
    type: 'create' | 'update' | 'delete';
    collection: string;
    data: any;
  }): Promise<void> {
    await this.init();
    if (!this.db) return;

    const itemId = action.data?.id || `temp-${Date.now()}`;
    await this.addPendingOperation(action.type, action.collection, itemId, action.data);
  }

  /**
   * Adiciona uma operação pendente (interno)
   */
  private async addPendingOperation(
    operation: 'create' | 'update' | 'delete',
    collection: string,
    itemId: string,
    data: any
  ): Promise<void> {
    if (!this.db) return;

    const pendingOp: PendingOperation = {
      id: `${collection}-${itemId}-${Date.now()}`,
      operation,
      collection,
      itemId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await this.db.put('pendingOperations', pendingOp);
  }

  /**
   * Processa operações pendentes
   */
  private async processPendingOperations(): Promise<void> {
    if (!this.db || !navigator.onLine) return;

    const pendingOps = await this.db.getAll('pendingOperations');

    // Ordena por timestamp
    pendingOps.sort((a, b) => a.timestamp - b.timestamp);

    for (const op of pendingOps) {
      try {
        await this.executePendingOperation(op);
        await this.db.delete('pendingOperations', op.id);
        console.log(`✅ Operação sincronizada: ${op.operation} ${op.collection}/${op.itemId}`);
      } catch (error) {
        console.error(`❌ Erro na sincronização:`, error);

        // Incrementa retry e remove se exceder limite
        op.retryCount++;
        op.error = error instanceof Error ? error.message : 'Erro desconhecido';

        if (op.retryCount >= 5) {
          await this.db.delete('pendingOperations', op.id);
          console.error(`🗑️ Operação removida após 5 tentativas: ${op.id}`);
        } else {
          await this.db.put('pendingOperations', op);
        }
      }
    }
  }

  /**
   * Executa uma operação pendente no servidor
   */
  private async executePendingOperation(op: PendingOperation): Promise<void> {
    const { apiClient } = await import('./api-client');

    switch (op.operation) {
      case 'create':
        await apiClient.create(op.collection, op.data);
        break;
      case 'update':
        await apiClient.update(op.collection, op.itemId, op.data);
        break;
      case 'delete':
        await apiClient.delete(op.collection, op.itemId, op.data);
        break;
    }
  }

  /**
   * Sincroniza uma coleção específica com o servidor
   */
  async syncCollection(collection: CollectionName, userId: string): Promise<void> {
    if (!navigator.onLine || !this.db) return;

    try {
      const { apiClient } = await import('./api-client');

      // 1. Busca dados do servidor
      const serverData = await apiClient.get(collection, userId);

      if (!Array.isArray(serverData)) {
        console.warn(`Dados do servidor para ${collection} não é um array`);
        return;
      }

      // 2. Para cada item do servidor, verifica se precisa atualizar localmente
      for (const serverItem of serverData) {
        const localItem = await this.db.get(collection, serverItem.id);

        if (!localItem) {
          // Item novo do servidor - salva localmente
          await this.db.put(collection, {
            ...serverItem,
            _localUpdatedAt: Date.now(),
            _serverUpdatedAt: Date.now(),
            _syncStatus: 'synced',
          });
        } else if (localItem._syncStatus === 'synced') {
          // Item já sincronizado - atualiza com dados do servidor
          await this.db.put(collection, {
            ...serverItem,
            _localUpdatedAt: Date.now(),
            _serverUpdatedAt: Date.now(),
            _syncStatus: 'synced',
          });
        }
        // Se _syncStatus === 'pending', mantém a versão local (será enviada ao servidor)
      }

      // 3. Atualiza metadados de sincronização
      await this.db.put('syncMetadata', {
        collection,
        lastSyncTimestamp: Date.now(),
      });

      // Notifica listeners sobre mudanças
      this.notifyChange(collection);

    } catch (error) {
      console.error(`Erro ao sincronizar ${collection}:`, error);
    }
  }

  /**
   * Sincroniza todas as coleções
   */
  async syncAll(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) return;

    this.syncInProgress = true;
    console.log('🔄 Iniciando sincronização completa...');

    try {
      // 1. Processa operações pendentes primeiro
      await this.processPendingOperations();

      // 2. Atualiza metadados de sync
      await this.db?.put('syncMetadata', {
        collection: '_global',
        lastSyncTimestamp: Date.now(),
      });

      console.log('✅ Sincronização completa finalizada');
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Força sincronização completa do servidor (pull)
   * Útil para refresh manual ou primeiro login
   */
  async forcePullFromServer(userId: string): Promise<void> {
    if (!navigator.onLine || !this.db) {
      console.warn('Não é possível sincronizar offline');
      return;
    }

    console.log('🔄 Forçando pull do servidor...');

    const collections: CollectionName[] = ['transactions', 'wallets', 'budgets', 'goals', 'installments'];

    for (const collection of collections) {
      await this.syncCollection(collection, userId);
    }

    console.log('✅ Pull do servidor concluído');
  }

  // ==================== SPECIFIC COLLECTION METHODS ====================

  /**
   * Normaliza opções - aceita boolean (synced) ou objeto de opções
   * Para manter compatibilidade com código legado
   */
  private normalizeOptions(syncedOrOptions?: boolean | { skipSync?: boolean }): { skipSync?: boolean } {
    if (typeof syncedOrOptions === 'boolean') {
      // Se true (synced), não precisa sincronizar de novo; se false, precisa
      return { skipSync: syncedOrOptions };
    }
    return syncedOrOptions || {};
  }

  // Transactions
  async saveTransaction(transaction: Transaction, syncedOrOptions?: boolean | { skipSync?: boolean }): Promise<Transaction> {
    return this.saveItem('transactions', transaction, this.normalizeOptions(syncedOrOptions));
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    return this.getItems('transactions', userId);
  }

  async deleteTransaction(transactionId: string, userId: string): Promise<void> {
    return this.deleteItem('transactions', transactionId, userId);
  }

  // Wallets
  async saveWallet(wallet: Wallet, syncedOrOptions?: boolean | { skipSync?: boolean }): Promise<Wallet> {
    return this.saveItem('wallets', wallet, this.normalizeOptions(syncedOrOptions));
  }

  async getWallets(userId: string): Promise<Wallet[]> {
    return this.getItems('wallets', userId);
  }

  async getWallet(walletId: string): Promise<Wallet | null> {
    return this.getItem('wallets', walletId);
  }

  async deleteWallet(walletId: string, userId: string): Promise<void> {
    return this.deleteItem('wallets', walletId, userId);
  }

  // Budgets
  async saveBudget(budget: Budget, syncedOrOptions?: boolean | { skipSync?: boolean }): Promise<Budget> {
    return this.saveItem('budgets', budget, this.normalizeOptions(syncedOrOptions));
  }

  async getBudgets(userId: string): Promise<Budget[]> {
    return this.getItems('budgets', userId);
  }

  async deleteBudget(budgetId: string, userId: string): Promise<void> {
    return this.deleteItem('budgets', budgetId, userId);
  }

  // Goals
  async saveGoal(goal: Goal, syncedOrOptions?: boolean | { skipSync?: boolean }): Promise<Goal> {
    return this.saveItem('goals', goal, this.normalizeOptions(syncedOrOptions));
  }

  async getGoals(userId: string): Promise<Goal[]> {
    return this.getItems('goals', userId);
  }

  async deleteGoal(goalId: string, userId: string): Promise<void> {
    return this.deleteItem('goals', goalId, userId);
  }

  // Installments
  async saveInstallment(installment: any, syncedOrOptions?: boolean | { skipSync?: boolean }): Promise<any> {
    return this.saveItem('installments', installment, this.normalizeOptions(syncedOrOptions));
  }

  async getInstallments(userId: string): Promise<any[]> {
    return this.getItems('installments', userId);
  }

  async deleteInstallment(installmentId: string, userId: string): Promise<void> {
    return this.deleteItem('installments', installmentId, userId);
  }

  // ==================== SETTINGS ====================

  async saveSetting(key: string, value: any): Promise<void> {
    await this.init();
    if (!this.db) return;

    await this.db.put('userSettings', { key, value, updatedAt: Date.now() });
  }

  async getSetting<T>(key: string): Promise<T | null> {
    await this.init();
    if (!this.db) return null;

    const result = await this.db.get('userSettings', key);
    return result?.value ?? null;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Remove metadados internos do item
   */
  private cleanItem<T>(item: SyncableItem): T {
    const { _localUpdatedAt, _serverUpdatedAt, _syncStatus, _deleted, ...cleanData } = item;
    return cleanData as T;
  }

  /**
   * Verifica se há operações pendentes
   */
  async hasPendingOperations(): Promise<boolean> {
    await this.init();
    if (!this.db) return false;

    const count = await this.db.count('pendingOperations');
    return count > 0;
  }

  /**
   * Obtém contagem de operações pendentes
   */
  async getPendingOperationsCount(): Promise<number> {
    await this.init();
    if (!this.db) return 0;

    return await this.db.count('pendingOperations');
  }

  /**
   * Obtém todas as operações pendentes (para compatibilidade com código legado)
   * @deprecated Use getSyncStatus() em vez disso
   */
  async getPendingActions(): Promise<PendingOperation[]> {
    await this.init();
    if (!this.db) return [];

    return await this.db.getAll('pendingOperations');
  }

  /**
   * Remove uma operação pendente (para compatibilidade)
   */
  async removePendingAction(actionId: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    await this.db.delete('pendingOperations', actionId);
  }

  /**
   * Limpa todos os dados locais (útil no logout)
   */
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) return;

    const collections: string[] = [
      'transactions', 'wallets', 'budgets', 'goals',
      'installments', 'categories', 'pendingOperations',
      'syncMetadata', 'userSettings'
    ];

    for (const collection of collections) {
      try {
        await this.db.clear(collection);
      } catch (error) {
        console.warn(`Erro ao limpar ${collection}:`, error);
      }
    }

    console.log('🗑️ Todos os dados locais foram limpos');
  }

  /**
   * Limpa uma coleção específica
   */
  async clearCollection(collection: CollectionName): Promise<void> {
    await this.init();
    if (!this.db) return;

    try {
      await this.db.clear(collection);
      console.log(`🗑️ Coleção ${collection} limpa`);
    } catch (error) {
      console.warn(`Erro ao limpar ${collection}:`, error);
    }
  }

  /**
   * Limpa dados de um usuário específico
   */
  async clearUserData(userId: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    const collections: CollectionName[] = ['transactions', 'wallets', 'budgets', 'goals', 'installments'];

    for (const collection of collections) {
      const items = await this.getItems(collection, userId);
      for (const item of items) {
        await this.db.delete(collection, (item as any).id);
      }
    }
  }

  // ==================== CHANGE LISTENERS ====================

  /**
   * Adiciona um listener para mudanças em uma coleção
   */
  addChangeListener(collection: string, callback: () => void): () => void {
    if (!this.changeListeners.has(collection)) {
      this.changeListeners.set(collection, new Set());
    }

    this.changeListeners.get(collection)!.add(callback);

    // Retorna função para remover o listener
    return () => {
      this.changeListeners.get(collection)?.delete(callback);
    };
  }

  /**
   * Notifica listeners sobre mudanças
   */
  private notifyChange(collection: string): void {
    this.changeListeners.get(collection)?.forEach(callback => callback());
    this.changeListeners.get('*')?.forEach(callback => callback()); // Global listeners
  }

  // ==================== STATUS & DEBUG ====================

  /**
   * Obtém status de sincronização
   */
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    isSyncing: boolean;
    pendingOperations: number;
    lastSync?: number;
  }> {
    await this.init();

    const pendingCount = await this.getPendingOperationsCount();
    const globalMeta = this.db ? await this.db.get('syncMetadata', '_global') : null;

    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: this.syncInProgress,
      pendingOperations: pendingCount,
      lastSync: globalMeta?.lastSyncTimestamp,
    };
  }

  /**
   * Debug: lista todas as operações pendentes
   */
  async debugPendingOperations(): Promise<PendingOperation[]> {
    await this.init();
    if (!this.db) return [];

    return await this.db.getAll('pendingOperations');
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorageManager();

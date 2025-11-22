// src/services/wallet-balance-service.ts

import {Transaction, Wallet} from '@/lib/types';
import {apiClient} from '@/lib/api-client';
import {offlineStorage} from '@/lib/offline-storage';

export class WalletBalanceService {
  /**
   * Atualiza o saldo da carteira baseado em uma transação
   * Sincroniza tanto com MongoDB quanto IndexedDB
   */
  static async updateBalanceForTransaction(transaction: Transaction, userId?: string): Promise<void> {
    if (!transaction.walletId) return;

    const effectiveUserId = userId || transaction.userId;
    if (!effectiveUserId) {
      console.error('UserId is required for wallet balance update');
      return;
    }

    try {
      let balanceChange = 0;

      switch (transaction.type) {
        case 'income':
          balanceChange = transaction.amount;
          break;
        case 'expense':
          balanceChange = -transaction.amount;
          break;
        case 'transfer':
          balanceChange = -transaction.amount;
          break;
      }

      if (balanceChange !== 0) {
        // Update main wallet
        await this.updateWalletBalance(transaction.walletId, balanceChange, effectiveUserId);
      }

      // For transfers, also update destination wallet
      if (transaction.type === 'transfer' && transaction.toWalletId) {
        await this.updateWalletBalance(transaction.toWalletId, transaction.amount, effectiveUserId);
      }
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      // Don't throw here to avoid breaking transaction operations
    }
  }

  /**
   * Reverte o saldo da carteira baseado em uma transação (para deleção ou edição)
   */
  static async revertBalanceForTransaction(transaction: Transaction, userId?: string): Promise<void> {
    if (!transaction.walletId) return;

    const effectiveUserId = userId || transaction.userId;
    if (!effectiveUserId) {
      console.error('UserId is required for wallet balance revert');
      return;
    }

    try {
      let balanceChange = 0;

      switch (transaction.type) {
        case 'income':
          balanceChange = -transaction.amount; // Reverter receita
          break;
        case 'expense':
          balanceChange = transaction.amount; // Reverter despesa
          break;
        case 'transfer':
          balanceChange = transaction.amount; // Reverter transferência
          break;
      }

      if (balanceChange !== 0) {
        // Revert main wallet
        await this.updateWalletBalance(transaction.walletId, balanceChange, effectiveUserId);
      }

      // For transfers, also revert destination wallet
      if (transaction.type === 'transfer' && transaction.toWalletId) {
        await this.updateWalletBalance(transaction.toWalletId, -transaction.amount, effectiveUserId);
      }
    } catch (error) {
      console.error('Error reverting wallet balance:', error);
      // Don't throw here to avoid breaking transaction operations
    }
  }

  /**
   * Atualiza o saldo de uma carteira específica
   */
  private static async updateWalletBalance(walletId: string, balanceChange: number, userId: string): Promise<void> {
    try {
      // Get current wallet from MongoDB
      const currentWallet = await apiClient.get('wallets', userId, walletId);
      if (currentWallet) {
        const newBalance = currentWallet.balance + balanceChange;

        // Update MongoDB
        await apiClient.update('wallets', walletId, {
          balance: newBalance
        });

        // Update IndexedDB for offline functionality
        await this.updateWalletInIndexedDB(currentWallet, newBalance);

        console.log(`Saldo da carteira ${walletId} atualizado: R$ ${newBalance.toFixed(2)} (${balanceChange > 0 ? '+' : ''}${balanceChange.toFixed(2)})`);
      }
    } catch (error) {
      console.error(`Error updating wallet ${walletId} balance:`, error);

      // If online update fails, store as pending action for later sync (only on client-side)
      if (typeof window !== 'undefined' && !navigator.onLine) {
        await offlineStorage.addPendingAction({
          type: 'update',
          collection: 'wallets',
          data: {
            id: walletId,
            updates: { balance: balanceChange },
            userId
          }
        });
      }

      throw error;
    }
  }

  /**
   * Atualiza carteira no IndexedDB para funcionamento offline
   */
  private static async updateWalletInIndexedDB(wallet: Wallet, newBalance: number): Promise<void> {
    // Only run on client-side (browser)
    if (typeof window === 'undefined') {
      return; // Skip IndexedDB operations on server
    }

    try {
      // Save wallet state in IndexedDB
      await offlineStorage.saveSetting(`wallet_${wallet.id}_balance`, newBalance);
      await offlineStorage.saveSetting(`wallet_${wallet.id}_updated`, Date.now());
    } catch (error) {
      console.error('Error updating wallet in IndexedDB:', error);
    }
  }

  /**
   * Recalcula o saldo de uma carteira baseado em todas as suas transações
   */
  static async recalculateWalletBalance(walletId: string, userId: string): Promise<void> {
    try {
      // Get all transactions for this wallet
      const allTransactions = await apiClient.get('transactions', userId);
      const walletTransactions = allTransactions.filter(
        (t: Transaction) => t.walletId === walletId || t.toWalletId === walletId
      );

      let calculatedBalance = 0;

      for (const transaction of walletTransactions) {
        if (transaction.walletId === walletId) {
          // Transação onde esta carteira é a origem
          switch (transaction.type) {
            case 'income':
              calculatedBalance += transaction.amount;
              break;
            case 'expense':
              calculatedBalance -= transaction.amount;
              break;
            case 'transfer':
              calculatedBalance -= transaction.amount;
              break;
          }
        }

        if (transaction.toWalletId === walletId && transaction.type === 'transfer') {
          // Transação onde esta carteira é o destino de uma transferência
          calculatedBalance += transaction.amount;
        }
      }

      // Update wallet with calculated balance
      await apiClient.update('wallets', walletId, {
        balance: calculatedBalance
      });

      // Update IndexedDB
      const wallet = await apiClient.get('wallets', userId, walletId);
      if (wallet) {
        await this.updateWalletInIndexedDB(wallet, calculatedBalance);
      }

      console.log(`Saldo da carteira ${walletId} recalculado: R$ ${calculatedBalance.toFixed(2)}`);
    } catch (error) {
      console.error('Error recalculating wallet balance:', error);
      throw error;
    }
  }

  /**
   * Sincroniza carteiras offline com o servidor
   */
  static async syncOfflineWallets(userId: string): Promise<void> {
    try {
      const pendingActions = await offlineStorage.getPendingActions();
      const walletActions = pendingActions.filter(action =>
        action.data.collection === 'wallets'
      );

      for (const action of walletActions) {
        try {
          if (action.type === 'update') {
            await apiClient.update('wallets', action.data.id, action.data.updates);
          }

          // Remove from pending after successful sync
          await offlineStorage.removePendingAction(action.id);
        } catch (error) {
          console.error('Failed to sync wallet action:', action, error);
        }
      }
    } catch (error) {
      console.error('Error syncing offline wallets:', error);
    }
  }
}

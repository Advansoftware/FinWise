// src/services/wallet-balance-service.ts

import { Transaction } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

export class WalletBalanceService {
  /**
   * Atualiza o saldo da carteira baseado em uma transação
   */
  static async updateBalanceForTransaction(transaction: Transaction): Promise<void> {
    if (!transaction.walletId) return;

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
        // Get current wallet
        const currentWallet = await apiClient.get('wallets', transaction.walletId);
        if (currentWallet) {
          // Update wallet balance
          await apiClient.update('wallets', transaction.walletId, {
            balance: currentWallet.balance + balanceChange
          });
        }
      }

      // For transfers, also update destination wallet
      if (transaction.type === 'transfer' && transaction.toWalletId) {
        const destinationWallet = await apiClient.get('wallets', transaction.toWalletId);
        if (destinationWallet) {
          await apiClient.update('wallets', transaction.toWalletId, {
            balance: destinationWallet.balance + transaction.amount
          });
        }
      }
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      // Don't throw here to avoid breaking transaction operations
    }
  }

  /**
   * Reverte o saldo da carteira baseado em uma transação (para deleção ou edição)
   */
  static async revertBalanceForTransaction(transaction: Transaction): Promise<void> {
    if (!transaction.walletId) return;

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
        // Get current wallet
        const currentWallet = await apiClient.get('wallets', transaction.walletId);
        if (currentWallet) {
          // Update wallet balance
          await apiClient.update('wallets', transaction.walletId, {
            balance: currentWallet.balance + balanceChange
          });
        }
      }

      // For transfers, also revert destination wallet
      if (transaction.type === 'transfer' && transaction.toWalletId) {
        const destinationWallet = await apiClient.get('wallets', transaction.toWalletId);
        if (destinationWallet) {
          await apiClient.update('wallets', transaction.toWalletId, {
            balance: destinationWallet.balance - transaction.amount
          });
        }
      }
    } catch (error) {
      console.error('Error reverting wallet balance:', error);
      // Don't throw here to avoid breaking transaction operations
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

      console.log(`Saldo da carteira ${walletId} recalculado: R$ ${calculatedBalance.toFixed(2)}`);
    } catch (error) {
      console.error('Error recalculating wallet balance:', error);
      throw error;
    }
  }
}

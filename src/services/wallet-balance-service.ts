
// src/services/wallet-balance-service.ts

import { Transaction } from '@/lib/types';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export class WalletBalanceService {
  /**
   * Atualiza o saldo da carteira baseado em uma transação
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

      // Ensure amount is a number
      const amount = Number(transaction.amount);
      if (isNaN(amount)) {
        console.error('Invalid amount for transaction:', transaction.amount);
        return;
      }

      switch (transaction.type) {
        case 'income':
          balanceChange = amount;
          break;
        case 'expense':
          balanceChange = -amount;
          break;
        case 'transfer':
          balanceChange = -amount;
          break;
      }

      console.log(`Updating balance for wallet ${transaction.walletId}: ${balanceChange}`);

      if (balanceChange !== 0) {
        // Update main wallet
        await this.updateWalletBalance(transaction.walletId, balanceChange, effectiveUserId);
      }

      // For transfers, also update destination wallet
      if (transaction.type === 'transfer' && transaction.toWalletId) {
        const toAmount = amount;
        if (toAmount !== 0) {
          await this.updateWalletBalance(transaction.toWalletId, toAmount, effectiveUserId);
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
  static async revertBalanceForTransaction(transaction: Transaction, userId?: string): Promise<void> {
    if (!transaction.walletId) return;

    const effectiveUserId = userId || transaction.userId;
    if (!effectiveUserId) {
      console.error('UserId is required for wallet balance revert');
      return;
    }

    try {
      let balanceChange = 0;
      const amount = Number(transaction.amount);

      switch (transaction.type) {
        case 'income':
          balanceChange = -amount; // Reverter receita
          break;
        case 'expense':
          balanceChange = amount; // Reverter despesa
          break;
        case 'transfer':
          balanceChange = amount; // Reverter transferência
          break;
      }

      if (balanceChange !== 0) {
        // Revert main wallet
        await this.updateWalletBalance(transaction.walletId, balanceChange, effectiveUserId);
      }

      // For transfers, also revert destination wallet
      if (transaction.type === 'transfer' && transaction.toWalletId) {
        await this.updateWalletBalance(transaction.toWalletId, -amount, effectiveUserId);
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
      const { db } = await connectToDatabase();

      const result = await db.collection('wallets').updateOne(
        { _id: new ObjectId(walletId), userId },
        { $inc: { balance: balanceChange } }
      );

      if (result.matchedCount === 0) {
        console.warn(`Wallet ${walletId} not found for balance update`);
      } else {
        console.log(`Saldo da carteira ${walletId} atualizado: ${balanceChange > 0 ? '+' : ''}${balanceChange.toFixed(2)}`);
      }
    } catch (error) {
      console.error(`Error updating wallet ${walletId} balance:`, error);
      throw error;
    }
  }

  /**
   * Recalcula o saldo de uma carteira baseado em todas as suas transações
   */
  static async recalculateWalletBalance(walletId: string, userId: string): Promise<void> {
    try {
      const { db } = await connectToDatabase();

      // Busca todas as transações que envolvem esta carteira
      const walletTransactions = await db.collection('transactions').find({
        userId,
        $or: [
          { walletId: walletId },
          { toWalletId: walletId }
        ]
      }).toArray();

      let calculatedBalance = 0;

      for (const transaction of walletTransactions) {
        // Cast manual para evitar problemas de tipagem com MongoDB
        const type = transaction.type as 'income' | 'expense' | 'transfer';
        const amount = Number(transaction.amount);

        if (transaction.walletId === walletId) {
          // Transação onde esta carteira é a origem
          switch (type) {
            case 'income':
              calculatedBalance += amount;
              break;
            case 'expense':
              calculatedBalance -= amount;
              break;
            case 'transfer':
              calculatedBalance -= amount;
              break;
          }
        }

        if (transaction.toWalletId === walletId && type === 'transfer') {
          // Transação onde esta carteira é o destino de uma transferência
          calculatedBalance += amount;
        }
      }

      // Update wallet with calculated balance
      await db.collection('wallets').updateOne(
        { _id: new ObjectId(walletId), userId },
        { $set: { balance: calculatedBalance } }
      );

      console.log(`Saldo da carteira ${walletId} recalculado: R$ ${calculatedBalance.toFixed(2)}`);
    } catch (error) {
      console.error('Error recalculating wallet balance:', error);
      throw error;
    }
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/utils/format_utils.dart';
import '../../core/providers/providers.dart';

class TransactionsScreen extends StatelessWidget {
  const TransactionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final transactionProvider = context.watch<TransactionProvider>();
    final transactions = transactionProvider.transactions;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Transações'),
        backgroundColor: AppTheme.background,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () => transactionProvider.loadTransactions(),
        color: AppTheme.primary,
        child: transactions.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.receipt_long_outlined,
                      size: 64,
                      color: Colors.white.withOpacity(0.3),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Nenhuma transação encontrada',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.5),
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: transactions.length,
                itemBuilder: (context, index) {
                  final transaction = transactions[index];
                  return _TransactionCard(transaction: transaction);
                },
              ),
      ),
    );
  }
}

class _TransactionCard extends StatelessWidget {
  final TransactionModel transaction;

  const _TransactionCard({required this.transaction});

  IconData _getCategoryIcon() {
    switch (transaction.category?.toLowerCase()) {
      case 'alimentação':
      case 'supermercado':
        return Icons.restaurant;
      case 'transporte':
        return Icons.directions_car;
      case 'lazer':
        return Icons.sports_esports;
      case 'saúde':
        return Icons.favorite;
      case 'educação':
        return Icons.school;
      case 'moradia':
        return Icons.home;
      case 'transferência':
        return Icons.swap_horiz;
      case 'investimentos':
        return Icons.trending_up;
      default:
        return Icons.receipt;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isExpense = transaction.type == TransactionType.expense;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: (isExpense ? AppTheme.error : AppTheme.success)
                  .withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              _getCategoryIcon(),
              size: 24,
              color: isExpense ? AppTheme.error : AppTheme.success,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transaction.description,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '${transaction.category ?? 'Outros'} • ${FormatUtils.formatDateShort(transaction.date)}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withOpacity(0.5),
                  ),
                ),
              ],
            ),
          ),
          Text(
            '${isExpense ? '-' : '+'} ${FormatUtils.formatCurrency(transaction.amount)}',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: isExpense ? AppTheme.error : AppTheme.success,
            ),
          ),
        ],
      ),
    );
  }
}

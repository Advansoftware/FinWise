import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/utils/format_utils.dart';
import '../../core/providers/providers.dart';
import 'transaction_form_screen.dart';

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
        child: CustomScrollView(
          slivers: [
            // Botão de adicionar transação no topo (grid 12)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: _AddTransactionButton(
                  onPressed: () async {
                    final result = await TransactionFormScreen.show(context);
                    if (result == true) {
                      transactionProvider.loadTransactions(refresh: true);
                    }
                  },
                ),
              ),
            ),
            // Lista de transações
            if (transactions.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.receipt_long_outlined,
                        size: 64,
                        color: Colors.white.withAlpha(77),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Nenhuma transação encontrada',
                        style: TextStyle(
                          color: Colors.white.withAlpha(128),
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Toque no botão acima para adicionar',
                        style: TextStyle(
                          color: Colors.white.withAlpha(77),
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final transaction = transactions[index];
                      return _TransactionCard(
                        transaction: transaction,
                        onTap: () async {
                          final result = await TransactionFormScreen.show(
                            context,
                            transaction: transaction,
                          );
                          if (result == true) {
                            transactionProvider.loadTransactions(refresh: true);
                          }
                        },
                      );
                    },
                    childCount: transactions.length,
                  ),
                ),
              ),
            // Espaço extra no final para não ficar colado
            const SliverToBoxAdapter(
              child: SizedBox(height: 100),
            ),
          ],
        ),
      ),
    );
  }
}

/// Botão de adicionar transação (ocupa toda largura)
class _AddTransactionButton extends StatelessWidget {
  final VoidCallback onPressed;

  const _AddTransactionButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppTheme.primary,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(51),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.add,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Adicionar Transação',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TransactionCard extends StatelessWidget {
  final TransactionModel transaction;
  final VoidCallback? onTap;

  const _TransactionCard({
    required this.transaction,
    this.onTap,
  });

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

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
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
                      .withAlpha(25),
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
                        color: Colors.white.withAlpha(128),
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
        ),
      ),
    );
  }
}

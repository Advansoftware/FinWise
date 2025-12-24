import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/utils/format_utils.dart';
import '../../core/providers/providers.dart';
import '../../core/widgets/compact_add_button.dart';
import '../../core/widgets/skeleton_loading.dart';
import 'widgets/transactions_filter_sheet.dart';
import 'transaction_form_screen.dart';

class TransactionsScreen extends StatelessWidget {
  const TransactionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final transactionProvider = context.watch<TransactionProvider>();
    final transactions = transactionProvider.transactions;
    final isLoading = transactionProvider.isLoading;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Transações'),
        backgroundColor: AppTheme.background,
        elevation: 0,
        actions: [
          Stack(
            children: [
              IconButton(
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (context) => const TransactionsFilterSheet(),
                  );
                },
                icon: const Icon(Icons.filter_list, color: Colors.white),
              ),
              if (transactionProvider.filterCategory != null || 
                  transactionProvider.filterType != null || 
                  transactionProvider.filterWalletId != null)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppTheme.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => transactionProvider.loadTransactions(),
        color: AppTheme.primary,
        child: CustomScrollView(
          slivers: [
            // Botões de ação
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: AddTransactionButton(
                  isCompact: true,
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
            if (isLoading && transactions.isEmpty)
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => const SkeletonTransactionCard(),
                    childCount: 6,
                  ),
                ),
              )
            else if (transactions.isEmpty)
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
                      return _SwipeableTransactionCard(
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
                        onDelete: () async {
                          final confirmed = await _showDeleteConfirmation(context, transaction);
                          if (confirmed == true) {
                            final success = await transactionProvider.deleteTransaction(transaction.id);
                            if (success && context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Transação excluída'),
                                  backgroundColor: AppTheme.success,
                                ),
                              );
                            }
                          }
                          return confirmed == true;
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

// ============================================================================
// Swipeable Transaction Card
// ============================================================================

Future<bool?> _showDeleteConfirmation(BuildContext context, TransactionModel transaction) {
  return showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      backgroundColor: AppTheme.card,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Text('Confirmar Exclusão', style: TextStyle(color: Colors.white)),
      content: Text(
        'Tem certeza que deseja excluir a transação "${transaction.description}"? Esta ação não pode ser desfeita.',
        style: TextStyle(color: Colors.white.withAlpha(204)),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: Text('Cancelar', style: TextStyle(color: Colors.white.withAlpha(153))),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(context, true),
          style: FilledButton.styleFrom(backgroundColor: AppTheme.error),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.delete, size: 18),
              SizedBox(width: 4),
              Text('Excluir'),
            ],
          ),
        ),
      ],
    ),
  );
}

class _SwipeableTransactionCard extends StatelessWidget {
  final TransactionModel transaction;
  final VoidCallback? onTap;
  final Future<bool> Function() onDelete;

  const _SwipeableTransactionCard({
    required this.transaction,
    this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(transaction.id),
      direction: DismissDirection.endToStart,
      confirmDismiss: (direction) => onDelete(),
      background: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppTheme.error,
          borderRadius: BorderRadius.circular(12),
        ),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            const Text(
              'Excluir',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.delete,
              color: Colors.white,
              size: 28,
            ),
          ],
        ),
      ),
      child: _TransactionCard(
        transaction: transaction,
        onTap: onTap,
      ),
    );
  }
}

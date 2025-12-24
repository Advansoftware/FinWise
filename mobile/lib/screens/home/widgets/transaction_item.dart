import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/models.dart';
import '../../../../core/utils/format_utils.dart';

class TransactionItem extends StatelessWidget {
  final TransactionModel transaction;

  const TransactionItem({super.key, required this.transaction});

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
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: AppTheme.border.withAlpha(128),
          ),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: (isExpense ? AppTheme.error : AppTheme.success)
                  .withAlpha(25),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              _getCategoryIcon(),
              size: 18,
              color: isExpense ? AppTheme.error : AppTheme.success,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transaction.description,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Colors.white,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '${transaction.category ?? 'Outros'} • ${FormatUtils.formatDateShort(transaction.date)}',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.white.withAlpha(128),
                  ),
                ),
              ],
            ),
          ),
          Text(
            '${isExpense ? '-' : '+'} ${FormatUtils.formatCurrency(transaction.amount)}',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isExpense ? AppTheme.error : AppTheme.success,
            ),
          ),
        ],
      ),
    );
  }
}

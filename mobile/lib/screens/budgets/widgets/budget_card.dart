import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/format_utils.dart';

class BudgetCard extends StatelessWidget {
  final BudgetModel budget;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const BudgetCard({
    super.key,
    required this.budget,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isOverBudget = budget.percentUsed > 100;
    final isWarning = budget.percentUsed > 80 && !isOverBudget;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: isOverBudget
            ? Border.all(color: AppTheme.error.withAlpha(102))
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: _getCategoryColor(budget.category).withAlpha(51),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        _getCategoryIcon(budget.category),
                        color: _getCategoryColor(budget.category),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            budget.category,
                            style: const TextStyle(
                              color: AppTheme.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (budget.name != null && budget.name!.isNotEmpty)
                            Text(
                              budget.name!,
                              style: const TextStyle(
                                color: AppTheme.textSecondary,
                                fontSize: 12,
                              ),
                            ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, size: 20),
                      color: AppTheme.textSecondary,
                      onPressed: onDelete,
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Progress bar
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: (budget.percentUsed / 100).clamp(0, 1),
                    backgroundColor: AppTheme.cardLight,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      isOverBudget
                          ? AppTheme.error
                          : isWarning
                              ? AppTheme.warning
                              : AppTheme.success,
                    ),
                    minHeight: 8,
                  ),
                ),

                const SizedBox(height: 12),

                // Values
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${FormatUtils.formatCurrency(budget.spent)} de ${FormatUtils.formatCurrency(budget.amount)}',
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: (isOverBudget
                                ? AppTheme.error
                                : isWarning
                                    ? AppTheme.warning
                                    : AppTheme.success)
                            .withAlpha(51),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${budget.percentUsed.toStringAsFixed(1)}%',
                        style: TextStyle(
                          color: isOverBudget
                              ? AppTheme.error
                              : isWarning
                                  ? AppTheme.warning
                                  : AppTheme.success,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),

                // Remaining
                if (budget.remaining >= 0)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'Restam ${FormatUtils.formatCurrency(budget.remaining)}',
                      style: const TextStyle(
                        color: AppTheme.success,
                        fontSize: 12,
                      ),
                    ),
                  )
                else
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'Excedido em ${FormatUtils.formatCurrency(-budget.remaining)}',
                      style: const TextStyle(
                        color: AppTheme.error,
                        fontSize: 12,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    final icons = {
      'Alimentação': Icons.restaurant,
      'Transporte': Icons.directions_car,
      'Moradia': Icons.home,
      'Saúde': Icons.medical_services,
      'Educação': Icons.school,
      'Lazer': Icons.sports_esports,
      'Compras': Icons.shopping_bag,
      'Serviços': Icons.build,
    };
    return icons[category] ?? Icons.category;
  }

  Color _getCategoryColor(String category) {
    final colors = {
      'Alimentação': Colors.orange,
      'Transporte': Colors.blue,
      'Moradia': Colors.purple,
      'Saúde': Colors.red,
      'Educação': Colors.green,
      'Lazer': Colors.pink,
      'Compras': Colors.amber,
      'Serviços': Colors.teal,
    };
    return colors[category] ?? AppTheme.primary;
  }
}

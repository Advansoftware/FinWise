import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/format_utils.dart';

class BudgetSummarySection extends StatelessWidget {
  final BudgetSummary summary;

  const BudgetSummarySection({super.key, required this.summary});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Card de progresso geral
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.card,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Uso Total',
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      '${summary.usagePercentage.toStringAsFixed(1)}%',
                      style: TextStyle(
                        color: summary.usagePercentage > 100
                            ? AppTheme.error
                            : summary.usagePercentage > 80
                                ? AppTheme.warning
                                : AppTheme.success,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: (summary.usagePercentage / 100).clamp(0, 1),
                    backgroundColor: AppTheme.cardLight,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      summary.usagePercentage > 100
                          ? AppTheme.error
                          : summary.usagePercentage > 80
                              ? AppTheme.warning
                              : AppTheme.success,
                    ),
                    minHeight: 8,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _SummaryItem(
                        label: 'Orçado',
                        value: FormatUtils.formatCurrency(summary.totalBudget),
                        color: AppTheme.primary,
                      ),
                    ),
                    Expanded(
                      child: _SummaryItem(
                        label: 'Gasto',
                        value: FormatUtils.formatCurrency(summary.totalSpent),
                        color: AppTheme.error,
                      ),
                    ),
                    Expanded(
                      child: _SummaryItem(
                        label: 'Restante',
                        value: FormatUtils.formatCurrency(summary.remaining),
                        color: summary.remaining >= 0
                            ? AppTheme.success
                            : AppTheme.error,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Status cards
          Row(
            children: [
              Expanded(
                child: _StatusCard(
                  icon: Icons.check_circle_outline,
                  label: 'No Limite',
                  count: summary.onTrackCount,
                  color: AppTheme.success,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatusCard(
                  icon: Icons.warning_amber_outlined,
                  label: 'Estourado',
                  count: summary.overBudgetCount,
                  color: AppTheme.error,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SummaryItem extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _SummaryItem({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            color: AppTheme.textSecondary,
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}

class _StatusCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final int count;
  final Color color;

  const _StatusCard({
    required this.icon,
    required this.label,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                count.toString(),
                style: TextStyle(
                  color: color,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                label,
                style: const TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

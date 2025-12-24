import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/format_utils.dart';

class GoalCard extends StatelessWidget {
  final GoalModel goal;
  final VoidCallback onTap;
  final VoidCallback? onAddAmount;
  final VoidCallback onDelete;

  const GoalCard({
    super.key,
    required this.goal,
    required this.onTap,
    this.onAddAmount,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final progress = goal.targetAmount > 0
        ? (goal.currentAmount / goal.targetAmount * 100)
        : 0.0;
    final isCompleted = goal.currentAmount >= goal.targetAmount;
    final remaining = goal.targetAmount - goal.currentAmount;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border:
            isCompleted ? Border.all(color: AppTheme.success.withAlpha(102)) : null,
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
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: (isCompleted
                                ? AppTheme.success
                                : AppTheme.primary)
                            .withAlpha(51),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Icon(
                        isCompleted ? Icons.emoji_events : Icons.flag,
                        color: isCompleted ? AppTheme.success : AppTheme.primary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            goal.name,
                            style: const TextStyle(
                              color: AppTheme.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (goal.targetDate != null)
                            Text(
                              'Meta: ${FormatUtils.formatDate(goal.targetDate!)}',
                              style: const TextStyle(
                                color: AppTheme.textSecondary,
                                fontSize: 12,
                              ),
                            ),
                        ],
                      ),
                    ),
                    if (isCompleted)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.success.withAlpha(51),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          '✓ Concluída',
                          style: TextStyle(
                            color: AppTheme.success,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                  ],
                ),

                const SizedBox(height: 16),

                // Progress bar
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: (progress / 100).clamp(0, 1),
                    backgroundColor: AppTheme.cardLight,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      isCompleted ? AppTheme.success : AppTheme.primary,
                    ),
                    minHeight: 8,
                  ),
                ),

                const SizedBox(height: 12),

                // Values
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          FormatUtils.formatCurrency(goal.currentAmount),
                          style: TextStyle(
                            color: isCompleted
                                ? AppTheme.success
                                : AppTheme.primary,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'de ${FormatUtils.formatCurrency(goal.targetAmount)}',
                          style: const TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${progress.toStringAsFixed(1)}%',
                          style: TextStyle(
                            color: isCompleted
                                ? AppTheme.success
                                : AppTheme.primary,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (!isCompleted)
                          Text(
                            'Faltam ${FormatUtils.formatCurrency(remaining)}',
                            style: const TextStyle(
                              color: AppTheme.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),

                // Actions
                if (!isCompleted && onAddAmount != null) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: onAddAmount,
                          icon: const Icon(Icons.add, size: 18),
                          label: const Text('Adicionar Valor'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.primary,
                            side: const BorderSide(color: AppTheme.primary),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, size: 20),
                        color: AppTheme.textSecondary,
                        onPressed: onDelete,
                      ),
                    ],
                  ),
                ] else if (isCompleted) ...[
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerRight,
                    child: IconButton(
                      icon: const Icon(Icons.delete_outline, size: 20),
                      color: AppTheme.textSecondary,
                      onPressed: onDelete,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

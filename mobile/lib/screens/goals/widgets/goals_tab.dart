import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/models.dart';
import 'goal_card.dart';
import 'goals_summary_card.dart';

class GoalsTab extends StatelessWidget {
  final List<GoalModel> goals;
  final GoalsSummary? summary;
  final bool showSummary;
  final String emptyMessage;
  final String emptySubMessage;
  final Function(GoalModel) onGoalTap;
  final Function(GoalModel)? onAddAmount;
  final Function(GoalModel) onDelete;
  final Future<void> Function() onRefresh;

  const GoalsTab({
    super.key,
    required this.goals,
    this.summary,
    required this.showSummary,
    required this.emptyMessage,
    required this.emptySubMessage,
    required this.onGoalTap,
    this.onAddAmount,
    required this.onDelete,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (goals.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withAlpha(51),
                  borderRadius: BorderRadius.circular(40),
                ),
                child: const Icon(
                  Icons.flag_outlined,
                  size: 40,
                  color: AppTheme.primary,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                emptyMessage,
                style: const TextStyle(
                  color: AppTheme.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                emptySubMessage,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppTheme.primary,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Resumo
          if (showSummary && summary != null) ...[
            GoalsSummaryCard(summary: summary!),
            const SizedBox(height: 16),
          ],

          // Lista de metas
          ...goals.map((goal) => GoalCard(
                goal: goal,
                onTap: () => onGoalTap(goal),
                onAddAmount:
                    onAddAmount != null ? () => onAddAmount!(goal) : null,
                onDelete: () => onDelete(goal),
              )),
        ],
      ),
    );
  }
}

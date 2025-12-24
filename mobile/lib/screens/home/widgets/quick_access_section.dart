import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class QuickAccessCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String description;
  final Color color;
  final VoidCallback onTap;

  const QuickAccessCard({
    super.key,
    required this.icon,
    required this.label,
    required this.description,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppTheme.card,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color.withAlpha(51),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 24,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(
                  color: Colors.white.withAlpha(128),
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Icon(
                    Icons.arrow_forward,
                    size: 18,
                    color: color,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class QuickAccessSection extends StatelessWidget {
  final VoidCallback onBudgetsTap;
  final VoidCallback onGoalsTap;

  const QuickAccessSection({
    super.key,
    required this.onBudgetsTap,
    required this.onGoalsTap,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: QuickAccessCard(
            icon: Icons.pie_chart_outline,
            label: 'Orçamentos',
            description: 'Controle de gastos',
            color: Colors.orange,
            onTap: onBudgetsTap,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: QuickAccessCard(
            icon: Icons.flag_outlined,
            label: 'Metas',
            description: 'Objetivos financeiros',
            color: Colors.green,
            onTap: onGoalsTap,
          ),
        ),
      ],
    );
  }
}

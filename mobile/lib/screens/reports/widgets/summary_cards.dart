// lib/screens/reports/widgets/summary_cards.dart

import 'package:flutter/material.dart';
import '../../../core/models/report_model.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format_utils.dart';

/// Cards de resumo financeiro
class SummaryCards extends StatelessWidget {
  final FinancialSummary summary;

  const SummaryCards({
    super.key,
    required this.summary,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Linha principal: Receita e Despesa
        Row(
          children: [
            Expanded(
              child: _SummaryCard(
                title: 'Receitas',
                value: summary.totalIncome,
                icon: Icons.arrow_upward,
                color: AppTheme.success,
                isPositive: true,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _SummaryCard(
                title: 'Despesas',
                value: summary.totalExpense,
                icon: Icons.arrow_downward,
                color: AppTheme.error,
                isPositive: false,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        // Linha secundária: Balanço e Taxa de Economia
        Row(
          children: [
            Expanded(
              child: _SummaryCard(
                title: 'Balanço',
                value: summary.balance,
                icon: Icons.account_balance_wallet,
                color: summary.balance >= 0 ? AppTheme.success : AppTheme.error,
                isPositive: summary.balance >= 0,
                showSign: true,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _PercentageCard(
                title: 'Taxa de Economia',
                percentage: summary.savingsRate,
                icon: Icons.savings,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        // Informações adicionais
        _InfoRow(
          items: [
            _InfoItem(
              label: 'Transações',
              value: summary.transactionCount.toString(),
              icon: Icons.receipt_long,
            ),
            _InfoItem(
              label: 'Média diária',
              value: FormatUtils.currency(summary.averageDaily),
              icon: Icons.calendar_today,
            ),
            if (summary.topCategory != null)
              _InfoItem(
                label: 'Top categoria',
                value: summary.topCategory!,
                icon: Icons.category,
              ),
          ],
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String title;
  final double value;
  final IconData icon;
  final Color color;
  final bool isPositive;
  final bool showSign;

  const _SummaryCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    required this.isPositive,
    this.showSign = false,
  });

  @override
  Widget build(BuildContext context) {
    final displayValue = showSign && value != 0
        ? '${value > 0 ? '+' : ''}${FormatUtils.currency(value)}'
        : FormatUtils.currency(value.abs());

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const Spacer(),
              Icon(
                isPositive ? Icons.trending_up : Icons.trending_down,
                color: color,
                size: 16,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            displayValue,
            style: TextStyle(
              color: color,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _PercentageCard extends StatelessWidget {
  final String title;
  final double percentage;
  final IconData icon;

  const _PercentageCard({
    required this.title,
    required this.percentage,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final isPositive = percentage >= 0;
    final color = isPositive ? AppTheme.success : AppTheme.error;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const Spacer(),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Text(
                '${percentage.toStringAsFixed(1)}%',
                style: TextStyle(
                  color: color,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 4),
              Icon(
                isPositive ? Icons.thumb_up : Icons.thumb_down,
                color: color,
                size: 16,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final List<_InfoItem> items;

  const _InfoRow({required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: items.map((item) => _buildInfoItem(item)).toList(),
      ),
    );
  }

  Widget _buildInfoItem(_InfoItem item) {
    return Column(
      children: [
        Icon(item.icon, color: AppTheme.textSecondary, size: 20),
        const SizedBox(height: 8),
        Text(
          item.value,
          style: const TextStyle(
            color: AppTheme.textPrimary,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          item.label,
          style: TextStyle(
            color: AppTheme.textSecondary,
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}

class _InfoItem {
  final String label;
  final String value;
  final IconData icon;

  _InfoItem({
    required this.label,
    required this.value,
    required this.icon,
  });
}

import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/format_utils.dart';

class ConsolidatedWalletCard extends StatelessWidget {
  final double totalBalance;
  final double totalIncome;
  final double totalExpense;
  final List<TransactionModel> transactions;

  const ConsolidatedWalletCard({
    super.key,
    required this.totalBalance,
    required this.totalIncome,
    required this.totalExpense,
    required this.transactions,
  });

  @override
  Widget build(BuildContext context) {
    // Cálculos
    final liquidFlow = totalIncome - totalExpense;
    final savingsRate = totalIncome > 0 
        ? ((totalIncome - totalExpense) / totalIncome) * 100 
        : 0.0;
    
    // Gasto por dia (assumindo mês atual ou filtro)
    // Para simplificar, vamos usar o número de dias passados no mês atual ou 1 se for dia 1.
    final now = DateTime.now();
    final daysPassed = now.day;
    final dailySpend = totalExpense / (daysPassed > 0 ? daysPassed : 1);

    // Maior Gasto
    TransactionModel? largestExpense;
    try {
      final expenses = transactions.where((t) => t.type == TransactionType.expense).toList();
      if (expenses.isNotEmpty) {
        expenses.sort((a, b) => b.amount.compareTo(a.amount));
        largestExpense = expenses.first;
      }
    } catch (_) {}

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.account_balance_wallet, color: AppTheme.primary, size: 20),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Carteira Consolidada',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    'Balanço total e insights',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.5),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Saldo Total
          const Text(
            'Saldo Total',
            style: TextStyle(
              fontSize: 12,
              color: Colors.white54,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            FormatUtils.formatCurrency(totalBalance),
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 24),

          // Receitas e Despesas (Linha)
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.arrow_downward, color: AppTheme.success, size: 14),
                        const SizedBox(width: 4),
                        const Text('Receitas', style: TextStyle(color: Colors.white54, fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '+${FormatUtils.formatCurrency(totalIncome)}',
                      style: const TextStyle(
                        color: AppTheme.success,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        const Icon(Icons.arrow_upward, color: AppTheme.error, size: 14),
                        const SizedBox(width: 4),
                        const Text('Despesas', style: TextStyle(color: Colors.white54, fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '-${FormatUtils.formatCurrency(totalExpense)}',
                      style: const TextStyle(
                        color: AppTheme.error,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Fluxo Líquido Bar
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.background,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.ssid_chart, color: AppTheme.secondary, size: 16),
                    SizedBox(width: 8),
                    Text(
                      'Fluxo Líquido',
                      style: TextStyle(fontSize: 12, color: Colors.white70),
                    ),
                  ],
                ),
                Text(
                  FormatUtils.formatCurrency(liquidFlow),
                  style: TextStyle(
                    color: liquidFlow >= 0 ? AppTheme.success : AppTheme.error,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Grid: Gasto/Dia e Taxa Economia
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Gasto/Dia', style: TextStyle(color: Colors.white54, fontSize: 11)),
                    const SizedBox(height: 4),
                    Text(
                      FormatUtils.formatCurrency(dailySpend),
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Taxa Economia', style: TextStyle(color: Colors.white54, fontSize: 11)),
                    const SizedBox(height: 4),
                    Text(
                      '${savingsRate.toStringAsFixed(1)}%',
                      style: TextStyle(
                        color: savingsRate >= 0 ? AppTheme.success : AppTheme.error,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Maior Gasto Progress Bar
          if (largestExpense != null) ...[
            const Text('Maior Gasto', style: TextStyle(color: Colors.white54, fontSize: 12)),
            const SizedBox(height: 8),
            Stack(
              children: [
                Container(
                  height: 6,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppTheme.background,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
                FractionallySizedBox(
                  widthFactor: (totalExpense > 0) 
                      ? (largestExpense.amount / totalExpense).clamp(0.0, 1.0) 
                      : 0.0,
                  child: Container(
                    height: 6,
                    decoration: BoxDecoration(
                      color: AppTheme.primary,
                      borderRadius: BorderRadius.circular(3),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primary.withOpacity(0.5),
                          blurRadius: 6,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  largestExpense.description,
                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                ),
                Text(
                  FormatUtils.formatCurrency(largestExpense.amount),
                  style: const TextStyle(color: AppTheme.error, fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

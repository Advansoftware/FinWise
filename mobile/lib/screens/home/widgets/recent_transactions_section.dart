import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/models.dart';
import 'transaction_item.dart';

class RecentTransactionsSection extends StatelessWidget {
  final List<TransactionModel> transactions;

  const RecentTransactionsSection({super.key, required this.transactions});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Transações Recentes',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              TextButton(
                onPressed: () {},
                child: const Text(
                  'Ver todas',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.primary,
                  ),
                ),
              ),
            ],
          ),
          if (transactions.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.receipt_long_outlined,
                      size: 40,
                      color: Colors.white.withOpacity(0.3),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Nenhuma transação encontrada',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.5),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            ...transactions.map((t) => TransactionItem(transaction: t)),
        ],
      ),
    );
  }
}

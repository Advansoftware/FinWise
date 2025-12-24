import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/format_utils.dart';
import '../../../core/providers/providers.dart';
import 'installment_menu.dart';
import 'next_payment_section.dart';

/// Card de parcelamento com informações completas
class InstallmentCard extends StatelessWidget {
  final InstallmentModel installment;
  final bool isCompleted;
  final VoidCallback? onRefresh;

  const InstallmentCard({
    super.key,
    required this.installment,
    this.isCompleted = false,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final progress = installment.progress;
    final hasOverdue = installment.payments.any((p) => p.isOverdue);
    final overdueCount = installment.payments.where((p) => p.isOverdue).length;
    final nextPayment = installment.payments
        .where((p) => !p.isPaid)
        .toList()
      ..sort((a, b) => a.dueDate.compareTo(b.dueDate));
    final nextDue = nextPayment.isNotEmpty ? nextPayment.first : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasOverdue ? AppTheme.error.withAlpha(128) : AppTheme.border,
        ),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title row with status badge and menu
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        installment.name,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    _StatusBadge(
                      isCompleted: isCompleted,
                      overdueCount: overdueCount,
                      hasNextPayment: nextDue != null,
                    ),
                    if (!isCompleted)
                      InstallmentMenu(
                        installment: installment,
                        onRefresh: onRefresh,
                      ),
                  ],
                ),
                // Description
                if (installment.description != null && installment.description!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      installment.description!,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withAlpha(153),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                const SizedBox(height: 12),

                // Progress section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Progresso',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withAlpha(153),
                      ),
                    ),
                    Text(
                      '${installment.paidInstallments}/${installment.totalInstallments} parcelas',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress,
                    backgroundColor: AppTheme.border,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      isCompleted ? AppTheme.success : AppTheme.primary,
                    ),
                    minHeight: 8,
                  ),
                ),
                const SizedBox(height: 16),

                // Values Grid
                Row(
                  children: [
                    Expanded(
                      child: _ValueItem(
                        label: 'Valor Total',
                        value: FormatUtils.formatCurrency(installment.totalAmount),
                        color: Colors.white,
                      ),
                    ),
                    Expanded(
                      child: _ValueItem(
                        label: 'Valor Parcela',
                        value: FormatUtils.formatCurrency(installment.installmentAmount),
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: _ValueItem(
                        label: 'Total Pago',
                        value: FormatUtils.formatCurrency(installment.totalPaid),
                        color: AppTheme.success,
                      ),
                    ),
                    Expanded(
                      child: _ValueItem(
                        label: 'Restante',
                        value: FormatUtils.formatCurrency(installment.remainingAmount),
                        color: AppTheme.warning,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Next Payment Section
          if (nextDue != null && !isCompleted)
            NextPaymentSection(
              payment: nextDue,
              overdueCount: overdueCount,
              installment: installment,
              onRefresh: onRefresh,
            ),
        ],
      ),
    );
  }
}

class _ValueItem extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _ValueItem({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: Colors.white.withAlpha(128),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
      ],
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final bool isCompleted;
  final int overdueCount;
  final bool hasNextPayment;

  const _StatusBadge({
    required this.isCompleted,
    required this.overdueCount,
    required this.hasNextPayment,
  });

  @override
  Widget build(BuildContext context) {
    if (isCompleted) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppTheme.success.withAlpha(30),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check_circle, size: 12, color: AppTheme.success),
            const SizedBox(width: 4),
            Text(
              'Concluído',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppTheme.success,
              ),
            ),
          ],
        ),
      );
    }

    if (overdueCount > 0) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppTheme.error.withAlpha(30),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.warning, size: 12, color: AppTheme.error),
            const SizedBox(width: 4),
            Text(
              '$overdueCount em atraso',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppTheme.error,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.primary.withAlpha(30),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.schedule, size: 12, color: AppTheme.primary),
          const SizedBox(width: 4),
          Text(
            'Em dia',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppTheme.primary,
            ),
          ),
        ],
      ),
    );
  }
}

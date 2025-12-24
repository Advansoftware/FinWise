import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/models.dart';
import '../../../../core/utils/format_utils.dart';

class PaymentScheduleItem extends StatelessWidget {
  final String installmentName;
  final InstallmentPayment payment;

  const PaymentScheduleItem({
    super.key,
    required this.installmentName,
    required this.payment,
  });

  @override
  Widget build(BuildContext context) {
    final isOverdue = payment.isOverdue;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isOverdue ? AppTheme.error.withAlpha(128) : AppTheme.border,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: (isOverdue ? AppTheme.error : AppTheme.primary).withAlpha(25),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                '${payment.installmentNumber}',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: isOverdue ? AppTheme.error : AppTheme.primary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  installmentName,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Colors.white,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  FormatUtils.formatDateShort(payment.dueDate),
                  style: TextStyle(
                    fontSize: 11,
                    color: isOverdue ? AppTheme.error : Colors.white54,
                  ),
                ),
                if (isOverdue)
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.error.withAlpha(30),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'Em atraso',
                      style: TextStyle(
                        fontSize: 10,
                        color: AppTheme.error,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Text(
            FormatUtils.formatCurrency(payment.scheduledAmount),
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

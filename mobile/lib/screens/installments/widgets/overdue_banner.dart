import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/models.dart';
import '../../../../core/utils/format_utils.dart';

class OverduePaymentInfo {
  final InstallmentModel installment;
  final InstallmentPayment payment;

  OverduePaymentInfo({required this.installment, required this.payment});
}

class OverdueBanner extends StatelessWidget {
  final List<OverduePaymentInfo> overduePayments;
  final VoidCallback onPayPressed;
  final VoidCallback onSchedulePressed;

  const OverdueBanner({
    super.key,
    required this.overduePayments,
    required this.onPayPressed,
    required this.onSchedulePressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.error.withAlpha(20),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.error.withAlpha(128)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(Icons.warning_amber, size: 18, color: AppTheme.error),
              const SizedBox(width: 8),
              Text(
                '${overduePayments.length} parcela(s) em atraso',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.error,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...overduePayments.take(2).map((info) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.error.withAlpha(10),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.error.withAlpha(77)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '${info.installment.name} - ${info.payment.installmentNumber}ª',
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Text(
                    FormatUtils.formatCurrency(info.payment.scheduledAmount),
                    style: TextStyle(
                      color: AppTheme.error,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          )),
          if (overduePayments.length > 2)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                '+${overduePayments.length - 2} parcela(s) em atraso',
                style: TextStyle(
                  color: AppTheme.error,
                  fontSize: 11,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onPayPressed,
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: AppTheme.error),
                    foregroundColor: AppTheme.error,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  child: const Text('Quitar', style: TextStyle(fontSize: 13)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  onPressed: onSchedulePressed,
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.white54),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  child: const Text('Cronograma', style: TextStyle(fontSize: 13)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

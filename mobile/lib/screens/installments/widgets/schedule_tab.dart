import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/models.dart';
import '../../../../core/utils/format_utils.dart';
import 'payment_schedule_item.dart';

class PaymentWithInstallment {
  final InstallmentModel installment;
  final InstallmentPayment payment;

  PaymentWithInstallment({
    required this.installment,
    required this.payment,
  });
}

class ScheduleTab extends StatelessWidget {
  final List<InstallmentModel> installments;

  const ScheduleTab({super.key, required this.installments});

  @override
  Widget build(BuildContext context) {
    final allPayments = <PaymentWithInstallment>[];
    for (final installment in installments) {
      for (final payment in installment.payments.where((p) => !p.isPaid)) {
        allPayments.add(PaymentWithInstallment(
          installment: installment,
          payment: payment,
        ));
      }
    }
    allPayments.sort((a, b) => a.payment.dueDate.compareTo(b.payment.dueDate));

    final paymentsByMonth = <String, List<PaymentWithInstallment>>{};
    for (final item in allPayments) {
      final monthKey = '${item.payment.dueDate.year}-${item.payment.dueDate.month.toString().padLeft(2, '0')}';
      paymentsByMonth.putIfAbsent(monthKey, () => []).add(item);
    }

    final sortedMonths = paymentsByMonth.keys.toList()..sort();

    if (sortedMonths.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.event_available,
              size: 64,
              color: Colors.white.withAlpha(77),
            ),
            const SizedBox(height: 16),
            Text(
              'Nenhum pagamento pendente',
              style: TextStyle(
                color: Colors.white.withAlpha(128),
                fontSize: 16,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: sortedMonths.length,
      itemBuilder: (context, index) {
        final monthKey = sortedMonths[index];
        final payments = paymentsByMonth[monthKey]!;
        final date = DateTime.parse('$monthKey-01');
        final monthTotal = payments.fold<double>(
          0,
          (sum, p) => sum + p.payment.scheduledAmount,
        );

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.primary.withAlpha(25),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    FormatUtils.formatMonthYear(date),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primary,
                    ),
                  ),
                  Text(
                    FormatUtils.formatCurrency(monthTotal),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            ...payments.map((p) => PaymentScheduleItem(
              installmentName: p.installment.name,
              payment: p.payment,
            )),
            const SizedBox(height: 16),
          ],
        );
      },
    );
  }
}

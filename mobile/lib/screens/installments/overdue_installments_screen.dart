import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/utils/format_utils.dart';
import '../../core/providers/installment_provider.dart';
import 'widgets/widgets.dart';

class OverdueInstallmentsScreen extends StatelessWidget {
  const OverdueInstallmentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Parcelas em Atraso'),
        backgroundColor: AppTheme.card,
        foregroundColor: AppTheme.textPrimary,
        elevation: 0,
      ),
      body: Consumer<InstallmentProvider>(
        builder: (context, provider, _) {
          final overduePayments = _getOverduePayments(provider.activeInstallments);

          if (overduePayments.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.check_circle_outline,
                    size: 64,
                    color: AppTheme.primary.withOpacity(0.5),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Nenhuma parcela em atraso!',
                    style: TextStyle(
                      color: AppTheme.textSecondary,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: overduePayments.length,
            itemBuilder: (context, index) {
              final info = overduePayments[index];
              return _OverdueCard(
                info: info,
                onTap: () => _showPayDialog(context, info),
              );
            },
          );
        },
      ),
    );
  }

  List<OverduePaymentInfo> _getOverduePayments(List<InstallmentModel> installments) {
    final overdueList = <OverduePaymentInfo>[];
    for (final installment in installments) {
      for (final payment in installment.payments) {
        if (payment.isOverdue) {
          overdueList.add(OverduePaymentInfo(
            installment: installment,
            payment: payment,
          ));
        }
      }
    }
    overdueList.sort((a, b) => a.payment.dueDate.compareTo(b.payment.dueDate));
    return overdueList;
  }

  void _showPayDialog(BuildContext context, OverduePaymentInfo info) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => RegisterPaymentModal(
        installment: info.installment,
        payment: info.payment,
        onSuccess: () {
          context.read<InstallmentProvider>().loadInstallments();
        },
      ),
    );
  }
}

class _OverdueCard extends StatelessWidget {
  final OverduePaymentInfo info;
  final VoidCallback onTap;

  const _OverdueCard({required this.info, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final daysOverdue = DateTime.now().difference(info.payment.dueDate).inDays;

    return Card(
      color: AppTheme.card,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AppTheme.error.withOpacity(0.5)),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.error.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.warning_amber_rounded,
                      color: AppTheme.error,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          info.installment.name,
                          style: const TextStyle(
                            color: AppTheme.textPrimary,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Parcela ${info.payment.installmentNumber} de ${info.installment.totalInstallments}',
                          style: const TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        FormatUtils.formatCurrency(info.payment.scheduledAmount),
                        style: const TextStyle(
                          color: AppTheme.error,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        FormatUtils.formatDate(info.payment.dueDate),
                        style: const TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Atrasado há $daysOverdue dias',
                  style: const TextStyle(
                    color: AppTheme.error,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/format_utils.dart';
import '../../../core/providers/providers.dart';
import 'register_payment_modal.dart';

/// Seção de próximo pagamento do card de parcelamento
class NextPaymentSection extends StatelessWidget {
  final InstallmentPayment payment;
  final int overdueCount;
  final InstallmentModel? installment;
  final VoidCallback? onRefresh;

  const NextPaymentSection({
    super.key,
    required this.payment,
    required this.overdueCount,
    this.installment,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final isOverdue = payment.isOverdue;
    final daysOverdue = isOverdue 
        ? DateTime.now().difference(payment.dueDate).inDays 
        : 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isOverdue ? AppTheme.error.withAlpha(15) : Colors.transparent,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(12),
          bottomRight: Radius.circular(12),
        ),
        border: Border(
          top: BorderSide(color: AppTheme.border),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Overdue warning
          if (isOverdue)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.error.withAlpha(25),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.error.withAlpha(77)),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning, size: 16, color: AppTheme.error),
                  const SizedBox(width: 8),
                  Text(
                    'Parcela em atraso!',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.error,
                    ),
                  ),
                ],
              ),
            ),

          // Payment info
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isOverdue ? 'Venceu em' : 'Próximo Vencimento',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.white.withAlpha(128),
                    ),
                  ),
                  Text(
                    FormatUtils.formatDateShort(payment.dueDate),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  if (isOverdue)
                    Text(
                      '$daysOverdue dias de atraso',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.white.withAlpha(128),
                      ),
                    ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'Parcela ${payment.installmentNumber}',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.white.withAlpha(128),
                    ),
                  ),
                  Text(
                    FormatUtils.formatCurrency(payment.scheduledAmount),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Action buttons
          const SizedBox(height: 16),
          
          // Registrar button (red/error color)
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => _handleRegisterPayment(context),
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.error,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              icon: const Icon(Icons.attach_money, size: 18),
              label: const Text('Registrar', style: TextStyle(fontWeight: FontWeight.w600)),
            ),
          ),
          
          const SizedBox(height: 8),
          
          // Marcar como Pago button (outline)
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _handleMarkAsPaid(context),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Colors.white38),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              icon: const Icon(Icons.check_circle_outline, size: 18),
              label: const Text('Marcar como Pago', style: TextStyle(fontWeight: FontWeight.w500)),
            ),
          ),

          // Multiple overdue warning
          if (overdueCount > 1)
            Container(
              margin: const EdgeInsets.only(top: 12),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.warning.withAlpha(25),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.warning.withAlpha(51)),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning_amber, size: 16, color: AppTheme.warning),
                  const SizedBox(width: 8),
                  Text(
                    'Você tem $overdueCount parcelas em atraso',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.warning,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _handleRegisterPayment(BuildContext context) async {
    if (installment == null) return;
    
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => RegisterPaymentModal(
        installment: installment!,
        payment: payment,
        onSuccess: () {
          if (onRefresh != null) {
            onRefresh!();
          }
        },
      ),
    );
  }

  void _handleMarkAsPaid(BuildContext context) async {
    if (installment == null) return;
    
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Marcar como Pago', style: TextStyle(color: Colors.white)),
        content: Text(
          'Marcar a parcela ${payment.installmentNumber} como paga?',
          style: TextStyle(color: Colors.white.withAlpha(204)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancelar', style: TextStyle(color: Colors.white.withAlpha(153))),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: AppTheme.success),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      try {
        await context.read<InstallmentProvider>().markAsPaid(
          installment!.id,
          payment.installmentNumber,
        );
        if (onRefresh != null) {
          onRefresh!();
        }
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Parcela ${payment.installmentNumber} marcada como paga!'),
              backgroundColor: AppTheme.success,
            ),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Erro: $e'),
              backgroundColor: AppTheme.error,
            ),
          );
        }
      }
    }
  }
}

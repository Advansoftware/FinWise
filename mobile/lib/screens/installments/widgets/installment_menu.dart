import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/format_utils.dart';
import '../../../core/providers/providers.dart';
import '../installment_form_screen.dart';

/// Menu de opções do card de parcelamento (editar, excluir, pagar)
class InstallmentMenu extends StatelessWidget {
  final InstallmentModel installment;
  final VoidCallback? onRefresh;

  const InstallmentMenu({
    super.key,
    required this.installment,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final nextPayment = installment.payments
        .where((p) => !p.isPaid)
        .toList()
      ..sort((a, b) => a.dueDate.compareTo(b.dueDate));
    final hasNextPayment = nextPayment.isNotEmpty;

    return PopupMenuButton<String>(
      icon: Icon(Icons.more_vert, size: 20, color: Colors.white.withAlpha(179)),
      color: AppTheme.card,
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      itemBuilder: (context) => [
        if (hasNextPayment)
          PopupMenuItem(
            value: 'pay',
            child: Row(
              children: [
                Icon(Icons.attach_money, size: 18, color: AppTheme.success),
                const SizedBox(width: 8),
                const Text('Registrar Pagamento', style: TextStyle(color: Colors.white)),
              ],
            ),
          ),
        PopupMenuItem(
          value: 'edit',
          child: Row(
            children: [
              Icon(Icons.edit, size: 18, color: Colors.white.withAlpha(179)),
              const SizedBox(width: 8),
              const Text('Editar', style: TextStyle(color: Colors.white)),
            ],
          ),
        ),
        PopupMenuItem(
          value: 'delete',
          child: Row(
            children: [
              Icon(Icons.delete, size: 18, color: AppTheme.error),
              const SizedBox(width: 8),
              Text('Excluir', style: TextStyle(color: AppTheme.error)),
            ],
          ),
        ),
      ],
      onSelected: (value) => _handleMenuAction(context, value),
    );
  }

  void _handleMenuAction(BuildContext context, String action) async {
    switch (action) {
      case 'pay':
        await _showPaymentDialog(context);
        break;
      case 'edit':
        final result = await InstallmentFormScreen.show(
          context,
          installment: installment,
        );
        if (result == true && onRefresh != null) {
          onRefresh!();
        }
        break;
      case 'delete':
        _showDeleteDialog(context);
        break;
    }
  }

  Future<void> _showPaymentDialog(BuildContext context) async {
    final nextPayment = installment.payments
        .where((p) => !p.isPaid)
        .toList()
      ..sort((a, b) => a.dueDate.compareTo(b.dueDate));
    
    if (nextPayment.isEmpty) return;
    
    final payment = nextPayment.first;
    
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Registrar Pagamento', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Marcar a parcela ${payment.installmentNumber} como paga?',
              style: TextStyle(color: Colors.white.withAlpha(204)),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.background,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Parcela ${payment.installmentNumber}',
                    style: const TextStyle(color: Colors.white),
                  ),
                  Text(
                    FormatUtils.formatCurrency(payment.scheduledAmount),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
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
          installment.id,
          payment.installmentNumber,
        );
        if (onRefresh != null) {
          onRefresh!();
        }
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Parcela ${payment.installmentNumber} paga com sucesso!'),
              backgroundColor: AppTheme.success,
            ),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Erro ao registrar pagamento: $e'),
              backgroundColor: AppTheme.error,
            ),
          );
        }
      }
    }
  }

  void _showDeleteDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Excluir Parcelamento', style: TextStyle(color: Colors.white)),
        content: Text(
          'Tem certeza que deseja excluir "${installment.name}"? Esta ação não pode ser desfeita.',
          style: TextStyle(color: Colors.white.withAlpha(204)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancelar', style: TextStyle(color: Colors.white.withAlpha(153))),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await context.read<InstallmentProvider>().deleteInstallment(installment.id);
                if (onRefresh != null) {
                  onRefresh!();
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Erro ao excluir: $e'),
                      backgroundColor: AppTheme.error,
                    ),
                  );
                }
              }
            },
            style: FilledButton.styleFrom(backgroundColor: AppTheme.error),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
  }
}

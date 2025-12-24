import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/format_utils.dart';

class AddAmountDialog extends StatefulWidget {
  final GoalModel goal;

  const AddAmountDialog({super.key, required this.goal});

  @override
  State<AddAmountDialog> createState() => _AddAmountDialogState();
}

class _AddAmountDialogState extends State<AddAmountDialog> {
  final TextEditingController _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final remaining = widget.goal.targetAmount - widget.goal.currentAmount;

    return AlertDialog(
      backgroundColor: AppTheme.card,
      title: const Text(
        'Adicionar Valor',
        style: TextStyle(color: AppTheme.textPrimary),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Faltam ${FormatUtils.formatCurrency(remaining)} para completar "${widget.goal.name}"',
            style: const TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _controller,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            autofocus: true,
            style: const TextStyle(color: AppTheme.textPrimary),
            decoration: InputDecoration(
              prefixText: 'R\$ ',
              prefixStyle: const TextStyle(color: AppTheme.textPrimary),
              hintText: '0,00',
              hintStyle: const TextStyle(color: AppTheme.textSecondary),
              filled: true,
              fillColor: AppTheme.cardLight,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        ElevatedButton(
          onPressed: () {
            final amount =
                double.tryParse(_controller.text.replaceAll(',', '.'));
            if (amount != null && amount > 0) {
              Navigator.pop(context, amount);
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primary,
            foregroundColor: Colors.white,
          ),
          child: const Text('Adicionar'),
        ),
      ],
    );
  }
}

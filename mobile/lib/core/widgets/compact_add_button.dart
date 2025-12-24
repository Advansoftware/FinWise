import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Botão compacto estilo Material UI para adicionar transações
/// Usa as cores do Gastometria
class CompactAddButton extends StatelessWidget {
  final VoidCallback onPressed;
  final String label;
  final IconData icon;

  const CompactAddButton({
    super.key,
    required this.onPressed,
    this.label = 'Adicionar',
    this.icon = Icons.add,
  });

  @override
  Widget build(BuildContext context) {
    return FilledButton.icon(
      onPressed: onPressed,
      style: FilledButton.styleFrom(
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        elevation: 2,
        shadowColor: AppTheme.primary.withOpacity(0.4),
      ),
      icon: Icon(icon, size: 18),
      label: Text(
        label,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

/// Botão de adicionar transação compacto
class AddTransactionButton extends StatelessWidget {
  final VoidCallback onPressed;
  final bool isCompact;

  const AddTransactionButton({
    super.key,
    required this.onPressed,
    this.isCompact = true,
  });

  @override
  Widget build(BuildContext context) {
    if (isCompact) {
      return CompactAddButton(
        onPressed: onPressed,
        label: 'Nova transação',
        icon: Icons.add,
      );
    }

    // Versão full width
    return FilledButton.icon(
      onPressed: onPressed,
      style: FilledButton.styleFrom(
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 48),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        elevation: 3,
        shadowColor: AppTheme.primary.withOpacity(0.4),
      ),
      icon: const Icon(Icons.add, size: 20),
      label: const Text(
        'Adicionar Transação',
        style: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

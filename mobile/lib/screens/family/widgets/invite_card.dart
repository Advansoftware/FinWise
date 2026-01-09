// lib/screens/family/widgets/invite_card.dart

import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/family_model.dart';
import 'package:intl/intl.dart';

/// Card de convite pendente
class InviteCard extends StatelessWidget {
  final FamilyInvite invite;
  final bool canCancel;
  final VoidCallback? onCancel;

  const InviteCard({
    super.key,
    required this.invite,
    this.canCancel = false,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppTheme.warning.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          // Ícone
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.warning.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.mail_outline,
              color: AppTheme.warning,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  invite.email,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    _StatusBadge(status: invite.status),
                    const SizedBox(width: 8),
                    Text(
                      'Enviado ${_formatDate(invite.createdAt)}',
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Ação
          if (canCancel && onCancel != null)
            IconButton(
              onPressed: onCancel,
              icon: const Icon(Icons.close, color: AppTheme.error),
              tooltip: 'Cancelar convite',
            ),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(date);
      
      if (diff.inDays == 0) {
        return 'hoje';
      } else if (diff.inDays == 1) {
        return 'ontem';
      } else if (diff.inDays < 7) {
        return 'há ${diff.inDays} dias';
      } else {
        return DateFormat('dd/MM').format(date);
      }
    } catch (_) {
      return dateStr;
    }
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      'pending' => ('Pendente', AppTheme.warning),
      'accepted' => ('Aceito', AppTheme.success),
      'declined' => ('Recusado', AppTheme.error),
      'expired' => ('Expirado', AppTheme.textSecondary),
      'cancelled' => ('Cancelado', AppTheme.textSecondary),
      _ => ('Pendente', AppTheme.warning),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

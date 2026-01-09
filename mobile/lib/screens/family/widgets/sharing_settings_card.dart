// lib/screens/family/widgets/sharing_settings_card.dart

import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/family_model.dart';

/// Card de configurações de compartilhamento do usuário
class SharingSettingsCard extends StatefulWidget {
  final FamilyMember? member;
  final Function(MemberPrivacySettings)? onUpdate;

  const SharingSettingsCard({
    super.key,
    this.member,
    this.onUpdate,
  });

  @override
  State<SharingSettingsCard> createState() => _SharingSettingsCardState();
}

class _SharingSettingsCardState extends State<SharingSettingsCard> {
  late bool _shareTransactions;
  late bool _shareBudgets;
  late bool _shareGoals;
  late bool _showTotalBalance;

  @override
  void initState() {
    super.initState();
    final privacy = widget.member?.privacySettings;
    _shareTransactions = _hasPermission(privacy, ShareableResource.transactions);
    _shareBudgets = _hasPermission(privacy, ShareableResource.budgets);
    _shareGoals = _hasPermission(privacy, ShareableResource.goals);
    _showTotalBalance = privacy?.showTotalBalance ?? true;
  }

  bool _hasPermission(MemberPrivacySettings? privacy, ShareableResource resource) {
    if (privacy == null) return true;
    final config = privacy.sharing.where((s) => s.resource == resource).firstOrNull;
    return config?.permission != PermissionLevel.none;
  }

  void _updateSettings() {
    final sharing = <ResourceSharingConfig>[];
    
    for (final resource in ShareableResource.values) {
      final enabled = switch (resource) {
        ShareableResource.transactions => _shareTransactions,
        ShareableResource.budgets => _shareBudgets,
        ShareableResource.goals => _shareGoals,
        _ => true,
      };
      
      sharing.add(ResourceSharingConfig(
        resource: resource,
        permission: enabled ? PermissionLevel.view : PermissionLevel.none,
      ));
    }
    
    final settings = MemberPrivacySettings(
      sharing: sharing,
      showTotalBalance: _showTotalBalance,
    );
    
    widget.onUpdate?.call(settings);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'O que você compartilha com a família:',
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 12),
          
          _ToggleItem(
            icon: Icons.receipt_long,
            title: 'Transações',
            subtitle: 'Receitas e despesas',
            value: _shareTransactions,
            onChanged: (value) {
              setState(() => _shareTransactions = value);
              _updateSettings();
            },
          ),
          
          _ToggleItem(
            icon: Icons.pie_chart,
            title: 'Orçamentos',
            subtitle: 'Limites por categoria',
            value: _shareBudgets,
            onChanged: (value) {
              setState(() => _shareBudgets = value);
              _updateSettings();
            },
          ),
          
          _ToggleItem(
            icon: Icons.flag,
            title: 'Metas',
            subtitle: 'Objetivos financeiros',
            value: _shareGoals,
            onChanged: (value) {
              setState(() => _shareGoals = value);
              _updateSettings();
            },
          ),
          
          _ToggleItem(
            icon: Icons.account_balance_wallet,
            title: 'Saldo Total',
            subtitle: 'Mostrar meu saldo total',
            value: _showTotalBalance,
            onChanged: (value) {
              setState(() => _showTotalBalance = value);
              _updateSettings();
            },
            showDivider: false,
          ),
        ],
      ),
    );
  }
}

class _ToggleItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;
  final bool showDivider;

  const _ToggleItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
    this.showDivider = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  color: AppTheme.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w500,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Switch(
                value: value,
                onChanged: onChanged,
                activeColor: AppTheme.primary,
              ),
            ],
          ),
        ),
        if (showDivider)
          Divider(color: AppTheme.border, height: 1),
      ],
    );
  }
}

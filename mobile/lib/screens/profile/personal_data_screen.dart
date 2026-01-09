import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';
import '../../core/providers/providers.dart';

class PersonalDataScreen extends StatelessWidget {
  const PersonalDataScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Dados Pessoais'),
        backgroundColor: AppTheme.background,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Info Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: AppTheme.primary),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Por motivos de segurança, alguns dados só podem ser alterados na versão web do Gastometria.',
                    style: TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // User Info Fields
          _InfoCard(
            children: [
              _InfoItem(
                label: 'Nome Completo',
                value: user?.displayName ?? 'Não informado',
                icon: Icons.person_outline,
              ),
              const Divider(color: AppTheme.border, height: 1),
              _InfoItem(
                label: 'E-mail',
                value: user?.email ?? 'Não informado',
                icon: Icons.email_outlined,
              ),
              const Divider(color: AppTheme.border, height: 1),
              _InfoItem(
                label: 'Plano Atual',
                value: _getPlanLabel(user?.plan),
                icon: Icons.star_outline,
                valueColor: _getPlanColor(user?.plan),
              ),
              const Divider(color: AppTheme.border, height: 1),
              _InfoItem(
                label: 'ID do Usuário',
                value: user?.id ?? '-',
                icon: Icons.fingerprint,
                isSmall: true,
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Action Button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _openWebProfile(context),
              icon: const Icon(Icons.open_in_new, size: 18),
              label: const Text('Gerenciar Conta na Web'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                side: const BorderSide(color: AppTheme.primary),
                foregroundColor: AppTheme.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getPlanLabel(String? plan) {
    if (plan?.toLowerCase() == 'infinity') return 'Infinity';
    if (plan?.toLowerCase() == 'pro') return 'Pro';
    return 'Gratuito';
  }

  Color _getPlanColor(String? plan) {
    if (plan?.toLowerCase() == 'infinity') return const Color(0xFFF59E0B); // Amber
    if (plan?.toLowerCase() == 'pro') return AppTheme.primary;
    return Colors.white70;
  }

  Future<void> _openWebProfile(BuildContext context) async {
    final uri = Uri.parse('https://gastometria.com.br/profile');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Não foi possível abrir o link'),
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
    }
  }
}

class _InfoCard extends StatelessWidget {
  final List<Widget> children;

  const _InfoCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(children: children),
    );
  }
}

class _InfoItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color? valueColor;
  final bool isSmall;

  const _InfoItem({
    required this.label,
    required this.value,
    required this.icon,
    this.valueColor,
    this.isSmall = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 20, color: AppTheme.primary),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withOpacity(0.5),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: isSmall ? 13 : 15,
                    fontWeight: isSmall ? FontWeight.normal : FontWeight.w500,
                    color: valueColor ?? Colors.white,
                    fontFamily: isSmall ? 'Monospace' : null,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

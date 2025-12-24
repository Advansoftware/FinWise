import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/providers/providers.dart';

/// Tela de Configurações
/// Contém: Biometria, tema, notificações, etc.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _biometricAvailable = false;
  String _biometricDescription = 'Biometria';

  @override
  void initState() {
    super.initState();
    _checkBiometric();
  }

  Future<void> _checkBiometric() async {
    final authProvider = context.read<AuthProvider>();
    final canShow = await authProvider.canShowBiometricOption();
    final description = await authProvider.getBiometricDescription();
    
    if (mounted) {
      setState(() {
        _biometricAvailable = canShow || authProvider.biometricAvailable;
        _biometricDescription = description;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Configurações'),
        backgroundColor: AppTheme.background,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Seção: Segurança
          _SectionTitle('Segurança'),
          const SizedBox(height: 8),
          _SettingsCard(
            children: [
              // Biometria toggle
              _BiometricToggle(
                available: _biometricAvailable,
                enabled: authProvider.biometricEnabled,
                description: _biometricDescription,
                onChanged: (value) async {
                  await authProvider.setBiometricEnabled(value);
                },
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Seção: Aparência
          _SectionTitle('Aparência'),
          const SizedBox(height: 8),
          _SettingsCard(
            children: [
              _SettingsItem(
                icon: Icons.dark_mode_outlined,
                label: 'Tema escuro',
                trailing: Switch(
                  value: true, // Sempre dark por enquanto
                  onChanged: null, // Desabilitado
                  activeColor: AppTheme.primary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Seção: Notificações
          _SectionTitle('Notificações'),
          const SizedBox(height: 8),
          _SettingsCard(
            children: [
              _SettingsItem(
                icon: Icons.notifications_outlined,
                label: 'Notificações push',
                trailing: Switch(
                  value: true,
                  onChanged: (value) {
                    // TODO: Implementar toggle de notificações
                  },
                  activeColor: AppTheme.primary,
                ),
              ),
              const Divider(color: AppTheme.border, height: 1),
              _SettingsItem(
                icon: Icons.calendar_today_outlined,
                label: 'Lembrete de parcelas',
                trailing: Switch(
                  value: true,
                  onChanged: (value) {
                    // TODO: Implementar toggle de lembretes
                  },
                  activeColor: AppTheme.primary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Seção: Dados
          _SectionTitle('Dados'),
          const SizedBox(height: 8),
          _SettingsCard(
            children: [
              _SettingsItemButton(
                icon: Icons.download_outlined,
                label: 'Exportar dados',
                subtitle: 'Baixe suas transações em CSV',
                onTap: () {
                  // TODO: Implementar exportação
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Exportação em breve!'),
                      backgroundColor: AppTheme.primary,
                    ),
                  );
                },
              ),
              const Divider(color: AppTheme.border, height: 1),
              _SettingsItemButton(
                icon: Icons.cached_outlined,
                label: 'Limpar cache',
                subtitle: 'Libere espaço no dispositivo',
                onTap: () {
                  // TODO: Implementar limpeza de cache
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Cache limpo!'),
                      backgroundColor: AppTheme.success,
                    ),
                  );
                },
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Seção: Sobre
          _SectionTitle('Sobre'),
          const SizedBox(height: 8),
          _SettingsCard(
            children: [
              _SettingsItemButton(
                icon: Icons.info_outline,
                label: 'Sobre o app',
                subtitle: 'Versão 1.0.0',
                onTap: () {
                  _showAboutDialog(context);
                },
              ),
              const Divider(color: AppTheme.border, height: 1),
              _SettingsItemButton(
                icon: Icons.description_outlined,
                label: 'Termos de uso',
                subtitle: 'Leia nossos termos',
                onTap: () {
                  // TODO: Abrir termos
                },
              ),
              const Divider(color: AppTheme.border, height: 1),
              _SettingsItemButton(
                icon: Icons.privacy_tip_outlined,
                label: 'Política de privacidade',
                subtitle: 'Saiba como protegemos seus dados',
                onTap: () {
                  // TODO: Abrir política
                },
              ),
            ],
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primary, Color(0xFF7C3AED)],
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.account_balance_wallet, color: Colors.white, size: 24),
            ),
            const SizedBox(width: 12),
            const Text('Gastometria', style: TextStyle(color: Colors.white)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Versão 1.0.0',
              style: TextStyle(color: Colors.white.withAlpha(179)),
            ),
            const SizedBox(height: 8),
            Text(
              'Controle financeiro inteligente com IA.',
              style: TextStyle(color: Colors.white.withAlpha(128)),
            ),
            const SizedBox(height: 16),
            Text(
              '© 2025 Gastometria',
              style: TextStyle(color: Colors.white.withAlpha(102), fontSize: 12),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fechar'),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// Section Title
// ============================================================================

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: Colors.white.withAlpha(128),
        letterSpacing: 0.5,
      ),
    );
  }
}

// ============================================================================
// Settings Card
// ============================================================================

class _SettingsCard extends StatelessWidget {
  final List<Widget> children;

  const _SettingsCard({required this.children});

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

// ============================================================================
// Biometric Toggle
// ============================================================================

class _BiometricToggle extends StatelessWidget {
  final bool available;
  final bool enabled;
  final String description;
  final ValueChanged<bool> onChanged;

  const _BiometricToggle({
    required this.available,
    required this.enabled,
    required this.description,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isFingerprint = description.toLowerCase().contains('digital') ||
        description.toLowerCase().contains('fingerprint');
    final isFace = description.toLowerCase().contains('face') ||
        description.toLowerCase().contains('rosto');

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: (available ? AppTheme.primary : Colors.grey).withAlpha(25),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              isFace ? Icons.face : Icons.fingerprint,
              size: 22,
              color: available ? AppTheme.primary : Colors.grey,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: available ? Colors.white : Colors.grey,
                  ),
                ),
                Text(
                  available
                      ? 'Login rápido e seguro'
                      : 'Não disponível neste dispositivo',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withAlpha(128),
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: enabled,
            onChanged: available ? onChanged : null,
            activeColor: AppTheme.primary,
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// Settings Item
// ============================================================================

class _SettingsItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final Widget trailing;

  const _SettingsItem({
    required this.icon,
    required this.label,
    required this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppTheme.primary.withAlpha(25),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 20, color: AppTheme.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
          trailing,
        ],
      ),
    );
  }
}

// ============================================================================
// Settings Item Button
// ============================================================================

class _SettingsItemButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  const _SettingsItemButton({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withAlpha(25),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 20, color: AppTheme.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withAlpha(128),
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: Colors.white.withAlpha(77), size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

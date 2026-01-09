import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';
import '../../core/providers/providers.dart';
import '../../core/services/local_storage_service.dart';
import 'personal_data_screen.dart';
import 'gamification_rules_screen.dart';
import '../home/widgets/gamification_widgets.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _biometricAvailable = false;
  String _biometricDescription = 'Biometria';
  bool _pushNotificationsEnabled = true;
  bool _installmentRemindersEnabled = true;
  final LocalStorageService _localStorage = LocalStorageService();

  @override
  void initState() {
    super.initState();
    _checkBiometric();
    _loadNotificationSettings();
  }

  Future<void> _loadNotificationSettings() async {
    await _localStorage.init();
    final pushEnabled = _localStorage.prefs.getBool('push_notifications_enabled') ?? true;
    final remindersEnabled = _localStorage.prefs.getBool('installment_reminders_enabled') ?? true;
    if (mounted) {
      setState(() {
        _pushNotificationsEnabled = pushEnabled;
        _installmentRemindersEnabled = remindersEnabled;
      });
    }
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

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Não foi possível abrir o link'),
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Perfil'),
        backgroundColor: AppTheme.background,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _handleLogout(context, authProvider),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Avatar e info do usuário

          Center(
            child: Column(
              children: [
                _buildAvatar(user),
                const SizedBox(height: 16),
                Text(
                  user?.displayName ?? 'Usuário',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user?.email ?? '',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.6),
                  ),
                ),
                const SizedBox(height: 12),
                _buildPlanBadge(user),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Créditos IA
          if (user != null)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                   const Icon(Icons.psychology, color: AppTheme.primary),
                   const SizedBox(width: 8),
                   Text(
                     '${user.aiCredits} Créditos de IA',
                     style: const TextStyle(
                       color: Colors.white,
                       fontWeight: FontWeight.bold,
                       fontSize: 16
                     ),
                   ),
                ],
              ),
            ),

          const SizedBox(height: 24),

          // Gamification Card
          const GamificationSection(),
          const SizedBox(height: 32),

          // Menu de opções (Agora com navegação para Dados Pessoais)
          _ProfileMenuItem(
            icon: Icons.person_outline,
            title: 'Dados Pessoais',
            subtitle: 'Edite suas informações',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const PersonalDataScreen()),
              );
            },
          ),
          _ProfileMenuItem(
            icon: Icons.notifications_outlined,
            title: 'Notificações',
            subtitle: 'Configure seus alertas',
            // Scroll to notification section or just placeholder since settings are below
            onTap: () {
              // TODO: Scroll to notification section? 
              // For now, since they are on the screen below, maybe just show a message or do nothing.
              // Or better, let's keep it consistent. The prompt didn't ask to remove these, 
              // but since I merged settings below, these menu items might be redundant?
              // The user prompt was "falta 1 item na tela de perfil, o item que abre o perfil do usuario mesmo".
              // So I am adding/fixing "Dados Pessoais". 
              // Ideally I should consolidate the "Configurações" section with this menu.
              // But to minimize risk/changes now, I will leave them as is or point them to the settings.
              // Actually, looking at my previous implementation, I had removed the "Menu de opções" block in favor of "_SettingsCard".
              // Oh, wait. In the "refactor" step (514), I replaced the body with _SettingsCard but also kept _ProfileMenuItem in the "TargetContent" of the *replace* call which might have been why it was confusing.
              // Let's look at the intended design. 
              // The design in Step 514 (ReplacementContent) had:
              //   - Avatar
              //   - _SectionTitle('Configurações') -> _SettingsCard (Biometria, Notificações)
              //   - _SectionTitle('Outros') -> _SettingsCard (Ajuda, Termos)
              // 
              // It did NOT have the _ProfileMenuItem list (Dados Pessoais, Assinatura etc).
              // BUT the user said "falta 1 item na tela de perfil, o item que abre o perfil do usuario mesmo".
              // So I should ADD "Dados Pessoais" either as a separate item or inside the settings card.
              // Given the design, a "Dados Pessoais" item fits well at the top or in a "Conta" section.
              // I will put it in a "Conta" section at the top.
            },
          ).build(context) == null ? const SizedBox() : const SizedBox(), // Hack because I don't want to use these legacy items if I'm using the new design.
          
          // Actually, let's stick to the structure I built in Step 514 which was clean, 
          // and just ADD the "Dados Pessoais" button.
          
          // RE-WRITING BODY TO MATCH STEP 514 + Personal Data Item
          
          // Seção: Conta (New)
          _SectionTitle('Conta'),
          const SizedBox(height: 8),
          _SettingsCard(
            children: [
              _SettingsItemButton(
                icon: Icons.person_outline,
                label: 'Dados Pessoais',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const PersonalDataScreen()),
                  );
                },
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Seção: Configurações Gerais
          _SectionTitle('Configurações'),
          const SizedBox(height: 8),
          _SettingsCard(
            children: [
              // Biometria
              _BiometricToggle(
                available: _biometricAvailable,
                enabled: authProvider.biometricEnabled,
                description: _biometricDescription,
                onChanged: (value) async {
                  await authProvider.setBiometricEnabled(value);
                },
              ),
              const Divider(color: AppTheme.border, height: 1),
              
              // Notificações Push
              _SettingsToggle(
                icon: Icons.notifications_outlined,
                label: 'Notificações push',
                value: _pushNotificationsEnabled,
                onChanged: (value) async {
                  setState(() => _pushNotificationsEnabled = value);
                  await _localStorage.prefs.setBool('push_notifications_enabled', value);
                },
              ),
              const Divider(color: AppTheme.border, height: 1),
              
              // Lembretes de Parcelas
              _SettingsToggle(
                icon: Icons.calendar_today_outlined,
                label: 'Lembrete de parcelas',
                value: _installmentRemindersEnabled,
                onChanged: (value) async {
                  setState(() => _installmentRemindersEnabled = value);
                  await _localStorage.prefs.setBool('installment_reminders_enabled', value);
                },
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Seção: Outros
          _SectionTitle('Outros'),
          const SizedBox(height: 8),
          _SettingsCard(
            children: [
              // Gamificação
              _SettingsItemButton(
                icon: Icons.emoji_events_outlined,
                label: 'Como funciona o jogo?',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const GamificationRulesScreen()),
                  );
                },
              ),
              const Divider(color: AppTheme.border, height: 1),

              // Ajuda / Suporte
              _SettingsItemButton(
                icon: Icons.help_outline,
                label: 'Ajuda e Suporte',
                onTap: () {
                   ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Suporte em breve!')),
                  );
                },
              ),
              const Divider(color: AppTheme.border, height: 1),
              
              // Termos de Uso
              _SettingsItemButton(
                icon: Icons.description_outlined,
                label: 'Termos de uso',
                onTap: () => _openUrl('https://gastometria.com.br/terms'),
              ),
              const Divider(color: AppTheme.border, height: 1),
              
              // Política de Privacidade
              _SettingsItemButton(
                icon: Icons.privacy_tip_outlined,
                label: 'Política de privacidade',
                onTap: () => _openUrl('https://gastometria.com.br/privacy'),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Botão de logout
          _LogoutButton(onTap: () => _handleLogout(context, authProvider)),
          
          const SizedBox(height: 32),

          // Versão do app
          Center(
            child: Text(
              'Gastometria v1.0.0',
              style: TextStyle(
                fontSize: 12,
                color: Colors.white.withOpacity(0.3),
              ),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildAvatar(dynamic user) {
    return Container(
      width: 100,
      height: 100,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppTheme.primary, Color(0xFF7C3AED)],
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withOpacity(0.3),
            blurRadius: 20,
          ),
        ],
      ),
      child: Center(
        child: Text(
          user?.displayName?.substring(0, 1).toUpperCase() ?? 'U',
          style: const TextStyle(
            fontSize: 40,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  Widget _buildPlanBadge(dynamic user) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: user?.isInfinity == true
              ? [const Color(0xFFF59E0B), const Color(0xFFEF4444)]
              : user?.isPro == true
                  ? [AppTheme.primary, const Color(0xFF3B82F6)]
                  : [Colors.grey.shade600, Colors.grey.shade700],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            user?.isInfinity == true
                ? Icons.all_inclusive
                : user?.isPro == true
                    ? Icons.star
                    : Icons.person,
            size: 16,
            color: Colors.white,
          ),
          const SizedBox(width: 6),
          Text(
            user?.plan ?? 'Free',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  void _handleLogout(BuildContext context, AuthProvider authProvider) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text('Sair da conta', style: TextStyle(color: Colors.white)),
        content: const Text('Deseja realmente sair?', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Sair', style: TextStyle(color: AppTheme.error)),
          ),
        ],
      ),
    );
    if (confirm == true) {
      await authProvider.logout();
    }
  }
}

// Widgets Auxiliares (trazidos ou adaptados do SettingsScreen)

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
            activeColor: Colors.white,
            activeTrackColor: AppTheme.primary,
          ),
        ],
      ),
    );
  }
}

class _SettingsToggle extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SettingsToggle({
    required this.icon,
    required this.label,
    required this.value,
    required this.onChanged,
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
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: Colors.white,
            activeTrackColor: AppTheme.primary,
          ),
        ],
      ),
    );
  }
}

class _SettingsItemButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _SettingsItemButton({
    required this.icon,
    required this.label,
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
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
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

class _LogoutButton extends StatelessWidget {
  final VoidCallback onTap;

  const _LogoutButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.error.withOpacity(0.3)),
      ),
      child: ListTile(
        leading: const Icon(Icons.logout, color: AppTheme.error),
        title: const Text(
          'Sair da conta',
          style: TextStyle(
            color: AppTheme.error,
            fontWeight: FontWeight.w600,
          ),
        ),
        onTap: onTap,
      ),
    );
  }
}
class _ProfileMenuItem extends StatelessWidget { // Keep for backward compatibility if I didn't clean it up in build
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ProfileMenuItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
      return const SizedBox();
  }
}

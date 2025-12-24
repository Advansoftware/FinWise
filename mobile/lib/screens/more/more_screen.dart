import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/providers/providers.dart';
import '../../core/providers/gamification_provider.dart';
import '../../core/models/gamification_model.dart';
import '../profile/profile_screen.dart';
import 'settings_screen.dart';

/// Tela "Mais" - equivalente ao menu lateral do site
/// Contém: Perfil resumido, navegação para outras telas, configurações
class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final gamificationProvider = context.watch<GamificationProvider>();
    final user = authProvider.user;
    final gamification = gamificationProvider.gamification;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Mais'),
        backgroundColor: AppTheme.background,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // User Card
          _UserCard(
            user: user,
            gamification: gamification,
            gamificationProvider: gamificationProvider,
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const ProfileScreen()),
            ),
          ),

          const SizedBox(height: 24),

          // Seção: Funcionalidades
          _SectionTitle('Funcionalidades'),
          const SizedBox(height: 8),
          _MenuCard(
            children: [
              _MenuItem(
                icon: Icons.pie_chart_outline,
                label: 'Orçamentos',
                subtitle: 'Gerencie seus limites mensais',
                onTap: () {
                  // TODO: Navegar para Orçamentos
                  _showComingSoon(context, 'Orçamentos');
                },
              ),
              const Divider(color: AppTheme.border, height: 1),
              _MenuItem(
                icon: Icons.flag_outlined,
                label: 'Metas',
                subtitle: 'Acompanhe seus objetivos',
                onTap: () {
                  // TODO: Navegar para Metas
                  _showComingSoon(context, 'Metas');
                },
              ),
              const Divider(color: AppTheme.border, height: 1),
              _MenuItem(
                icon: Icons.folder_outlined,
                label: 'Categorias',
                subtitle: 'Organize suas transações',
                onTap: () {
                  // TODO: Navegar para Categorias
                  _showComingSoon(context, 'Categorias');
                },
              ),
              const Divider(color: AppTheme.border, height: 1),
              _MenuItem(
                icon: Icons.bar_chart_outlined,
                label: 'Relatórios',
                subtitle: 'Análises e gráficos',
                onTap: () {
                  // TODO: Navegar para Relatórios
                  _showComingSoon(context, 'Relatórios');
                },
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Seção: Conta
          _SectionTitle('Conta'),
          const SizedBox(height: 8),
          _MenuCard(
            children: [
              _MenuItem(
                icon: Icons.person_outline,
                label: 'Perfil',
                subtitle: 'Seus dados pessoais',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const ProfileScreen()),
                ),
              ),
              const Divider(color: AppTheme.border, height: 1),
              _MenuItem(
                icon: Icons.settings_outlined,
                label: 'Configurações',
                subtitle: 'Biometria, tema e mais',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const SettingsScreen()),
                ),
              ),
              const Divider(color: AppTheme.border, height: 1),
              _MenuItem(
                icon: Icons.diamond_outlined,
                label: 'Assinatura',
                subtitle: 'Gerencie seu plano',
                onTap: () {
                  // TODO: Navegar para Assinatura
                  _showComingSoon(context, 'Assinatura');
                },
              ),
              const Divider(color: AppTheme.border, height: 1),
              _MenuItem(
                icon: Icons.help_outline,
                label: 'Ajuda',
                subtitle: 'Suporte e FAQ',
                onTap: () {
                  // TODO: Navegar para Ajuda
                  _showComingSoon(context, 'Ajuda');
                },
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Botão de Sair
          _LogoutButton(
            onTap: () => _handleLogout(context, authProvider),
          ),

          const SizedBox(height: 32),

          // Versão do app
          Center(
            child: Text(
              'Gastometria Mobile v1.0.0',
              style: TextStyle(
                fontSize: 12,
                color: Colors.white.withAlpha(77),
              ),
            ),
          ),

          const SizedBox(height: 16),
        ],
      ),
    );
  }

  void _showComingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$feature em breve!'),
        backgroundColor: AppTheme.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  void _handleLogout(BuildContext context, AuthProvider authProvider) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Sair da conta', style: TextStyle(color: Colors.white)),
        content: Text(
          'Deseja realmente sair?',
          style: TextStyle(color: Colors.white.withAlpha(204)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancelar', style: TextStyle(color: Colors.white.withAlpha(153))),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: AppTheme.error),
            child: const Text('Sair'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await authProvider.logout();
    }
  }
}

// ============================================================================
// User Card
// ============================================================================

class _UserCard extends StatelessWidget {
  final dynamic user;
  final GamificationModel? gamification;
  final GamificationProvider gamificationProvider;
  final VoidCallback onTap;

  const _UserCard({
    required this.user,
    required this.gamification,
    required this.gamificationProvider,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            // Avatar
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppTheme.primary, Color(0xFF7C3AED)],
                ),
              ),
              child: Center(
                child: Text(
                  user?.displayName?.substring(0, 1).toUpperCase() ?? 'U',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user?.displayName ?? 'Usuário',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    user?.email ?? '',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withAlpha(153),
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Gamification Level
                  if (gamification != null) ...[
                    Row(
                      children: [
                        Text(
                          gamification!.level.icon,
                          style: const TextStyle(fontSize: 14),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Nível ${gamification!.level.level}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.amber,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withAlpha(30),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${gamificationProvider.points} XP',
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppTheme.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.white.withAlpha(128)),
          ],
        ),
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
// Menu Card
// ============================================================================

class _MenuCard extends StatelessWidget {
  final List<Widget> children;

  const _MenuCard({required this.children});

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
// Menu Item
// ============================================================================

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  const _MenuItem({
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

// ============================================================================
// Logout Button
// ============================================================================

class _LogoutButton extends StatelessWidget {
  final VoidCallback onTap;

  const _LogoutButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.error.withAlpha(20),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.error.withAlpha(77)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.logout, size: 20, color: AppTheme.error),
                const SizedBox(width: 8),
                Text(
                  'Sair da conta',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.error,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/providers/providers.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

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
            onPressed: () async {
              await authProvider.logout();
            },
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
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppTheme.primary,
                        Color(0xFF7C3AED),
                      ],
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
                ),
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
                // Badge do plano
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 6,
                  ),
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
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Menu de opções
          _ProfileMenuItem(
            icon: Icons.person_outline,
            title: 'Dados Pessoais',
            subtitle: 'Edite suas informações',
            onTap: () {},
          ),
          _ProfileMenuItem(
            icon: Icons.notifications_outlined,
            title: 'Notificações',
            subtitle: 'Configure seus alertas',
            onTap: () {},
          ),
          _ProfileMenuItem(
            icon: Icons.security_outlined,
            title: 'Segurança',
            subtitle: 'Biometria e senha',
            onTap: () {},
          ),
          _ProfileMenuItem(
            icon: Icons.credit_card_outlined,
            title: 'Assinatura',
            subtitle: 'Gerencie seu plano',
            onTap: () {},
          ),
          _ProfileMenuItem(
            icon: Icons.help_outline,
            title: 'Ajuda',
            subtitle: 'Suporte e FAQ',
            onTap: () {},
          ),
          const SizedBox(height: 24),

          // Botão de logout
          Container(
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
              onTap: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (context) => AlertDialog(
                    backgroundColor: AppTheme.card,
                    title: const Text('Sair da conta'),
                    content: const Text('Deseja realmente sair?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context, false),
                        child: const Text('Cancelar'),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(context, true),
                        child: const Text(
                          'Sair',
                          style: TextStyle(color: AppTheme.error),
                        ),
                      ),
                    ],
                  ),
                );
                if (confirm == true) {
                  await authProvider.logout();
                }
              },
            ),
          ),
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
}

class _ProfileMenuItem extends StatelessWidget {
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
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppTheme.primary, size: 20),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            fontSize: 12,
            color: Colors.white.withOpacity(0.5),
          ),
        ),
        trailing: Icon(
          Icons.chevron_right,
          color: Colors.white.withOpacity(0.3),
        ),
        onTap: onTap,
      ),
    );
  }
}

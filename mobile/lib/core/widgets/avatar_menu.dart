import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/gamification_provider.dart';
import '../models/models.dart';
import '../models/gamification_model.dart';
import '../../core/widgets/plan_badge.dart';

/// Avatar do usuário com menu dropdown completo (igual ao site)
/// Inclui: info do usuário, gamificação, créditos, menu de navegação
class AvatarMenu extends StatelessWidget {
  final double size;
  final bool showName;

  const AvatarMenu({
    super.key,
    this.size = 40,
    this.showName = false,
  });

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final gamificationProvider = context.watch<GamificationProvider>();
    final user = authProvider.user;

    if (authProvider.isLoading) {
      return _SkeletonAvatar(size: size);
    }

    return GestureDetector(
      onTap: () => _showUserMenu(context, user, gamificationProvider),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _UserAvatar(user: user, size: size),
          if (showName) ...[
            const SizedBox(width: 8),
            Text(
              user?.displayName?.split(' ').first ?? 'Usuário',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
            const Icon(Icons.arrow_drop_down, color: Colors.white70),
          ],
        ],
      ),
    );
  }

  void _showUserMenu(
    BuildContext context,
    UserModel? user,
    GamificationProvider gamificationProvider,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => _UserMenuSheet(
        user: user,
        gamificationProvider: gamificationProvider,
      ),
    );
  }
}

class _UserMenuSheet extends StatelessWidget {
  final UserModel? user;
  final GamificationProvider gamificationProvider;

  const _UserMenuSheet({
    required this.user,
    required this.gamificationProvider,
  });

  @override
  Widget build(BuildContext context) {
    final gamification = gamificationProvider.gamification;

    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle bar
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // User Info Header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    _UserAvatar(user: user, size: 56),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.displayName ?? 'Usuário',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            user?.email ?? '',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white.withOpacity(0.6),
                            ),
                          ),
                          const SizedBox(height: 8),
                          PlanBadge(user: user),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const Divider(color: AppTheme.border, height: 1),

              // Gamification Section
              if (gamification != null) ...[
                _GamificationSection(
                  gamification: gamification,
                  provider: gamificationProvider,
                ),
                const Divider(color: AppTheme.border, height: 1),
              ],

              // Menu Items
              _MenuItem(
                icon: Icons.person_outline,
                label: 'Perfil',
                onTap: () {
                  Navigator.pop(context);
                  // Já está na navegação bottom
                },
              ),
              _MenuItem(
                icon: Icons.diamond_outlined,
                label: 'Assinatura',
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Navegar para assinatura
                },
              ),
              _MenuItem(
                icon: Icons.settings_outlined,
                label: 'Configurações',
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Navegar para configurações
                },
              ),

              const Divider(color: AppTheme.border, height: 1),

              // Logout
              _MenuItem(
                icon: Icons.logout,
                label: 'Sair',
                isDestructive: true,
                onTap: () async {
                  Navigator.pop(context);
                  await context.read<AuthProvider>().logout();
                },
              ),

              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _GamificationSection extends StatelessWidget {
  final GamificationModel gamification;
  final GamificationProvider provider;

  const _GamificationSection({
    required this.gamification,
    required this.provider,
  });

  @override
  Widget build(BuildContext context) {
    final level = gamification.level;
    final progress = provider.levelProgress;
    final xpCurrent = provider.points;
    final xpToNext = provider.xpToNextLevel;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Level info
          Row(
            children: [
              // Level icon container
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Colors.amber.withOpacity(0.3),
                      Colors.orange.withOpacity(0.3),
                    ],
                  ),
                  border: Border.all(
                    color: Colors.amber.withOpacity(0.5),
                    width: 1.5,
                  ),
                ),
                child: Center(
                  child: Text(
                    level.icon,
                    style: const TextStyle(fontSize: 20),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Nível ${level.level}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      level.name,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withOpacity(0.6),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$xpCurrent XP',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primary,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Progress bar
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Próximo nível',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.white.withOpacity(0.5),
                    ),
                  ),
                  Text(
                    '$xpCurrent/$xpToNext',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.white.withOpacity(0.5),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress / 100,
                  minHeight: 6,
                  backgroundColor: Colors.white.withOpacity(0.1),
                  valueColor: const AlwaysStoppedAnimation<Color>(
                    Colors.amber,
                  ),
                ),
              ),
            ],
          ),

          // Streak
          if (provider.streak > 0) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: Colors.orange.withOpacity(0.3),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.local_fire_department,
                    color: Colors.orange,
                    size: 18,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '${provider.streak} ${provider.streak == 1 ? "mês" : "meses"} em dia!',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Colors.orange,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Badges
          if (gamification.badges.isNotEmpty) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                ...gamification.badges.take(5).map((badge) => Container(
                  margin: const EdgeInsets.only(right: 6),
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.08),
                  ),
                  child: Center(
                    child: Text(
                      badge.icon,
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                )),
                if (gamification.badges.length > 5)
                  Text(
                    '+${gamification.badges.length - 5}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.5),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isDestructive ? Colors.redAccent : Colors.white;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(icon, color: color.withOpacity(isDestructive ? 1 : 0.7), size: 22),
              const SizedBox(width: 16),
              Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  color: color,
                  fontWeight: isDestructive ? FontWeight.w500 : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _UserAvatar extends StatelessWidget {
  final UserModel? user;
  final double size;

  const _UserAvatar({required this.user, required this.size});

  @override
  Widget build(BuildContext context) {
    final initial = user?.displayName?.substring(0, 1).toUpperCase() ?? 'U';
    
    return Container(
      width: size,
      height: size,
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
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Center(
        child: Text(
          initial,
          style: TextStyle(
            fontSize: size * 0.45,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

class _SkeletonAvatar extends StatelessWidget {
  final double size;

  const _SkeletonAvatar({required this.size});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white.withOpacity(0.1),
      ),
    );
  }
}

// Classe _PlanBadge removida (agora usa o widget reutilizável PlanBadge)

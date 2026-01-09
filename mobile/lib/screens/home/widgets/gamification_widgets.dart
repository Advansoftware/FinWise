import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/models/gamification_model.dart';
import '../../../core/providers/gamification_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../profile/gamification_rules_screen.dart';

/// Widget de progresso de gamificação
class GamificationWidget extends StatelessWidget {
  final int level;
  final int currentXP;
  final int xpForNextLevel;
  final int streak;
  final String levelTitle;

  const GamificationWidget({
    super.key,
    required this.level,
    required this.currentXP,
    required this.xpForNextLevel,
    required this.streak,
    required this.levelTitle,
  });

  double get progress => xpForNextLevel > 0 ? currentXP / xpForNextLevel : 0;

  String _getLevelIcon() {
    if (level >= 50) return '👑';
    if (level >= 40) return '💎';
    if (level >= 30) return '🏆';
    if (level >= 20) return '⭐';
    if (level >= 10) return '🔥';
    return '🌱';
  }

  @override
  Widget build(BuildContext context) {
    final textColor = Theme.of(context).colorScheme.onSurface;
    final cardColor = Theme.of(context).cardColor;
    final borderColor = Theme.of(context).dividerColor;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.primary.withOpacity(0.15),
            const Color(0xFF3B82F6).withOpacity(0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.primary.withOpacity(0.3),
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Avatar/Ícone de nível
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFFF59E0B),
                      Color(0xFFEF4444),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFF59E0B).withOpacity(0.3),
                      blurRadius: 12,
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    _getLevelIcon(),
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Info do nível
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Nível $level',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: textColor,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            levelTitle,
                            style: TextStyle(
                              fontSize: 10,
                              color: AppTheme.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$currentXP / $xpForNextLevel XP',
                      style: TextStyle(
                        fontSize: 12,
                        color: textColor.withOpacity(0.6),
                      ),
                    ),
                  ],
                ),
              ),
              // Streak
              if (streak > 0)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF97316).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFFF97316).withOpacity(0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.local_fire_department,
                        size: 16,
                        color: Color(0xFFF97316),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '$streak',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFFF97316),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          // Barra de progresso
          Stack(
            children: [
              Container(
                height: 6,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              FractionallySizedBox(
                widthFactor: progress.clamp(0.0, 1.0),
                child: Container(
                  height: 6,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [
                        AppTheme.primary,
                        Color(0xFF3B82F6),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(3),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary.withOpacity(0.5),
                        blurRadius: 6,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Card de missão diária
class DailyQuestCard extends StatelessWidget {
  final String title;
  final String description;
  final String icon;
  final int xp;
  final int progress;
  final int target;
  final bool isCompleted;

  const DailyQuestCard({
    super.key,
    required this.title,
    required this.description,
    required this.icon,
    required this.xp,
    required this.progress,
    required this.target,
    required this.isCompleted,
  });

  @override
  Widget build(BuildContext context) {
    final progressPercent = target > 0 ? progress / target : 0.0;
    final textColor = Theme.of(context).colorScheme.onSurface;
    final cardColor = Theme.of(context).cardColor;
    final borderColor = Theme.of(context).dividerColor;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isCompleted
            ? AppTheme.success.withOpacity(0.1)
            : cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCompleted
              ? AppTheme.success.withOpacity(0.3)
              : borderColor,
        ),
      ),
      child: Row(
        children: [
          // Ícone
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isCompleted
                  ? AppTheme.success.withOpacity(0.2)
                  : AppTheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: isCompleted
                  ? const Icon(
                      Icons.check_circle,
                      color: AppTheme.success,
                      size: 20,
                    )
                  : Text(
                      icon,
                      style: const TextStyle(fontSize: 18),
                    ),
            ),
          ),
          const SizedBox(width: 12),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isCompleted
                        ? AppTheme.success
                        : textColor,
                    decoration: isCompleted
                        ? TextDecoration.lineThrough
                        : null,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 11,
                    color: textColor.withOpacity(0.5),
                  ),
                ),
                if (!isCompleted) ...[
                  const SizedBox(height: 6),
                  LinearProgressIndicator(
                    value: progressPercent,
                    backgroundColor: AppTheme.primary.withOpacity(0.1),
                    valueColor: AlwaysStoppedAnimation<Color>(
                      AppTheme.primary,
                    ),
                    minHeight: 3,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          // XP
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 8,
              vertical: 4,
            ),
            decoration: BoxDecoration(
              color: isCompleted
                  ? AppTheme.success.withOpacity(0.2)
                  : const Color(0xFFF59E0B).withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: isCompleted ? Colors.transparent : const Color(0xFFF59E0B).withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.bolt,
                  size: 12,
                  color: isCompleted
                      ? AppTheme.success
                      : const Color(0xFFF59E0B),
                ),
                const SizedBox(width: 2),
                Text(
                  '+$xp',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: isCompleted
                        ? AppTheme.success
                        : const Color(0xFFF59E0B),
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

/// Seção de missões diárias
class DailyQuestsSection extends StatelessWidget {
  const DailyQuestsSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<GamificationProvider>(
      builder: (context, gamification, child) {
        final quests = gamification.dailyQuests;
        final completedCount = quests.where((q) => q.isCompleted).length;
        final totalCount = quests.length;
        final textColor = Theme.of(context).colorScheme.onSurface;
        final cardColor = Theme.of(context).cardColor;
        final borderColor = Theme.of(context).dividerColor;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: borderColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.flag_outlined,
                        size: 18,
                        color: AppTheme.primary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Missões Diárias',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: textColor,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: completedCount == totalCount && totalCount > 0
                          ? AppTheme.success.withOpacity(0.15)
                          : AppTheme.primary.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '$completedCount/$totalCount',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: completedCount == totalCount && totalCount > 0
                            ? AppTheme.success
                            : AppTheme.primary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (quests.isEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  child: Center(
                    child: Column(
                      children: [
                        const Text('🎯', style: TextStyle(fontSize: 32)),
                        const SizedBox(height: 8),
                        Text(
                          'Carregando missões...',
                          style: TextStyle(
                            fontSize: 13,
                            color: textColor.withOpacity(0.5),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ...quests.map((quest) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: DailyQuestCard(
                    title: quest.name,
                    description: quest.description,
                    icon: quest.icon,
                    xp: quest.xp,
                    progress: quest.progress,
                    target: quest.target,
                    isCompleted: quest.isCompleted,
                  ),
                )),
            ],
          ),
        );
      },
    );
  }
}

/// Widget de gamificação conectado ao Provider
class GamificationSection extends StatelessWidget {
  const GamificationSection({super.key});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const GamificationRulesScreen()),
        );
      },
      child: Consumer<GamificationProvider>(
        builder: (context, gamification, child) {
          return GamificationWidget(
            level: gamification.level,
            currentXP: gamification.points,
            xpForNextLevel: gamification.xpToNextLevel,
            streak: gamification.streak,
            levelTitle: gamification.levelTitle,
          );
        },
      ),
    );
  }
}

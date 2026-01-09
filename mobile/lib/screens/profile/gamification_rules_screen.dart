import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/constants/gamification_constants.dart';
import '../../core/providers/gamification_provider.dart';
import '../home/widgets/gamification_widgets.dart';

class GamificationRulesScreen extends StatefulWidget {
  const GamificationRulesScreen({super.key});

  @override
  State<GamificationRulesScreen> createState() => _GamificationRulesScreenState();
}

class _GamificationRulesScreenState extends State<GamificationRulesScreen> {
  @override
  void initState() {
    super.initState();
    // Garante que os dados estejam carregados
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<GamificationProvider>().loadGamification();
    });
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: AppBar(
          title: const Text('Gamificação'),
          backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
          elevation: 0,
          bottom: const TabBar(
            isScrollable: true,
            indicatorColor: AppTheme.primary,
            labelColor: AppTheme.primary,
            unselectedLabelColor: Colors.grey,
            tabs: [
              Tab(text: 'Visão Geral', icon: Icon(Icons.star_outline)),
              Tab(text: 'Níveis', icon: Icon(Icons.trending_up)),
              Tab(text: 'Badges', icon: Icon(Icons.workspace_premium_outlined)),
              Tab(text: 'Desafios', icon: Icon(Icons.track_changes_outlined)),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            _OverviewTab(),
            _LevelsTab(),
            _BadgesTab(),
            _ChallengesTab(),
          ],
        ),
      ),
    );
  }
}

class _OverviewTab extends StatelessWidget {
  const _OverviewTab();

  @override
  Widget build(BuildContext context) {
    final textColor = Theme.of(context).colorScheme.onSurface;
    final mutedColor = Theme.of(context).colorScheme.onSurface.withOpacity(0.6);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Status Card
        Consumer<GamificationProvider>(
          builder: (context, gamification, child) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: 8, left: 4),
                  child: Text(
                    'Seu Status Atual',
                    style: TextStyle(
                      color: textColor,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                GamificationWidget(
                  level: gamification.level,
                  currentXP: gamification.points,
                  xpForNextLevel: gamification.xpToNextLevel,
                  streak: gamification.streak,
                  levelTitle: gamification.levelTitle,
                ),
              ],
            );
          },
        ),
        
        const SizedBox(height: 24),
        
        // Como Ganhar XP
        _buildSectionTitle('Como Ganhar XP', Icons.bolt, AppTheme.success, textColor),
        const SizedBox(height: 12),
        _buildXpGrid(context),

        const SizedBox(height: 24),

        // Motivação
        _buildMotivationCard(context),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildSectionTitle(String title, IconData icon, Color color, Color textColor) {
    return Row(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
      ],
    );
  }

  Widget _buildMotivationCard(BuildContext context) {
    final textColor = Theme.of(context).colorScheme.onSurface;
    
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFFF59E0B).withOpacity(0.1), 
            const Color(0xFFEF4444).withOpacity(0.1)
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.amber.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          const Icon(Icons.local_fire_department, size: 48, color: Colors.amber),
          const SizedBox(height: 16),
           Text(
            'Por que Gamificação?',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 8),
           Text(
            'Estudos mostram que gamificação aumenta o engajamento em até 48%! Ao transformar tarefas financeiras em desafios, você cria hábitos positivos e duradouros. Cada XP ganho é um passo em direção à sua liberdade financeira! 🚀',
            textAlign: TextAlign.center,
            style: TextStyle(color: textColor.withOpacity(0.7), height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildXpGrid(BuildContext context) {
    final textColor = Theme.of(context).colorScheme.onSurface;
    final cardColor = Theme.of(context).cardColor;
    final borderColor = Theme.of(context).dividerColor;

    // Categories matching Web
    final categories = [
      {
        'title': 'Transações',
        'items': [
          {'name': 'Adicionar transação', 'xp': GamificationConstants.xpRewards['Nova Transação']},
          {'name': 'Categorizar transação', 'xp': GamificationConstants.xpRewards['Categorizar']},
          {'name': '1ª transação do dia', 'xp': GamificationConstants.xpRewards['1ª do Dia']},
        ]
      },
      {
        'title': 'Parcelamentos',
        'items': [
          {'name': 'Pagar parcela', 'xp': GamificationConstants.xpRewards['Pagar Parcela']},
          {'name': 'Bônus em dia', 'xp': GamificationConstants.xpRewards['Pagamento em Dia']},
          {'name': 'Completar', 'xp': GamificationConstants.xpRewards['Completar Carnê']},
        ]
      },
      {
        'title': 'Orçamentos & Metas',
        'items': [
          {'name': 'Criar orçamento', 'xp': GamificationConstants.xpRewards['Criar Orçamento']},
          {'name': 'Dentro do orçamento', 'xp': GamificationConstants.xpRewards['Dentro da Meta']},
          {'name': 'Completar meta', 'xp': GamificationConstants.xpRewards['Concluir Meta']},
        ]
      },
      {
        'title': 'Uso Diário',
        'items': [
          {'name': 'Login diário', 'xp': GamificationConstants.xpRewards['Login Diário']},
          {'name': 'Streak semanal', 'xp': GamificationConstants.xpRewards['Streak Semanal']},
          {'name': 'Usar IA', 'xp': GamificationConstants.xpRewards['Usar IA']},
        ]
      },
    ];

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: categories.map((cat) {
        return Container(
          width: double.infinity, // Full width on mobile looks better for list inside
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: borderColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                cat['title'] as String,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: textColor,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 12),
              ...(cat['items'] as List<Map<String, dynamic>>).map((item) {
                final xp = item['xp'] as int;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        item['name'] as String,
                        style: TextStyle(color: textColor.withOpacity(0.7), fontSize: 13),
                      ),
                      Text(
                        '+$xp XP',
                        style: const TextStyle(
                          color: AppTheme.success,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _LevelsTab extends StatelessWidget {
  const _LevelsTab();

  @override
  Widget build(BuildContext context) {
    return Consumer<GamificationProvider>(
      builder: (context, gamification, child) {
        final currentLevel = gamification.level;
        final currentPoints = gamification.points;
        final levels = GamificationConstants.levelNames.entries.toList();
        
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: levels.length,
          itemBuilder: (context, index) {
            final levelNum = levels[index].key;
            final info = levels[index].value;
            final xpRequired = GamificationConstants.levelThresholds[levelNum - 1];
            
            final isUnlocked = currentPoints >= xpRequired;
            final isCurrent = currentLevel == levelNum;

            return Card(
              color: isCurrent 
                  ? AppTheme.primary.withOpacity(0.1) 
                  : AppTheme.card.withOpacity(isUnlocked ? 1.0 : 0.6),
              elevation: isCurrent ? 4 : 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(
                  color: isCurrent ? AppTheme.primary : Colors.transparent, 
                  width: 2
                )
              ),
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.1 + (levelNum * 0.05)),
                        shape: BoxShape.circle,
                        boxShadow: isUnlocked ? [
                          BoxShadow(
                            color: AppTheme.primary.withOpacity(0.3),
                            blurRadius: 10,
                          )
                        ] : null,
                      ),
                      child: Center(
                        child: Text(
                          info.icon,
                          style: TextStyle(fontSize: 24, color: isUnlocked ? null : Colors.grey),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                'Nível $levelNum: ${info.name}',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: isUnlocked ? Colors.white : Colors.white60,
                                ),
                              ),
                              if (isCurrent) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primary,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Text('Atual', style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold)),
                                ),
                              ]
                            ],
                          ),
                          Text(
                            info.title,
                            style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 13),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '$xpRequired XP necessários',
                            style: const TextStyle(
                              color: AppTheme.primary,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _BadgesTab extends StatelessWidget {
  const _BadgesTab();

  @override
  Widget build(BuildContext context) {
    return Consumer<GamificationProvider>(
      builder: (context, gamification, child) {
        final earnedBadges = gamification.badges.map((b) => b.id).toSet();
        
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
             const Text(
              'Colecione conquistas únicas! 🏆',
              style: TextStyle(color: Colors.white70, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            _buildBadgeCategory('Iniciante', 'onboarding', earnedBadges),
            _buildBadgeCategory('Consistência', 'consistency', earnedBadges),
            _buildBadgeCategory('Pagamentos', 'payments', earnedBadges),
            _buildBadgeCategory('Economia', 'savings', earnedBadges),
            _buildBadgeCategory('Especiais', 'special', earnedBadges),
          ],
        );
      }
    );
  }

  Widget _buildBadgeCategory(String title, String categoryId, Set<String> earnedBadges) {
    final badges = GamificationConstants.allBadges.where((b) => b.category == categoryId).toList();
    
    if (badges.isEmpty) return const SizedBox();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 0.75, // Taller for description/status
          ),
          itemCount: badges.length,
          itemBuilder: (context, index) {
            final badge = badges[index];
            final color = GamificationConstants.rarityColors[badge.rarity]!;
            final isEarned = earnedBadges.contains(badge.id);
            
            return Container(
              decoration: BoxDecoration(
                color: isEarned ? color.bg.withOpacity(0.15) : AppTheme.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isEarned ? color.border : Colors.white10,
                  width: isEarned ? 1.5 : 1
                ),
              ),
              padding: const EdgeInsets.all(8),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Opacity(
                    opacity: isEarned ? 1.0 : 0.4,
                    child: Text(
                      badge.icon,
                      style: const TextStyle(fontSize: 28),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    badge.name,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isEarned ? color.text : Colors.white60,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    GamificationConstants.getRarityLabel(badge.rarity),
                    style: TextStyle(
                      fontSize: 8,
                      color: Colors.white.withOpacity(0.4),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _ChallengesTab extends StatelessWidget {
  const _ChallengesTab();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildSection('Missões Diárias', GamificationConstants.dailyQuests),
        const SizedBox(height: 24),
        _buildSection('Desafios Semanais', GamificationConstants.weeklyChallenges),
        const SizedBox(height: 24),
        _buildSection('Desafios Mensais', GamificationConstants.monthlyChallenges),
      ],
    );
  }

  Widget _buildSection(String title, List<QuestInfo> quests) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 12),
        ...quests.map((quest) => Card(
          color: AppTheme.card,
          margin: const EdgeInsets.only(bottom: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(quest.icon, style: const TextStyle(fontSize: 24)),
            ),
            title: Text(quest.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(quest.description, style: const TextStyle(color: Colors.white70, fontSize: 12)),
            ),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.amber.withOpacity(0.5)),
              ),
              child: Text(
                '+${quest.xp} XP',
                style: const TextStyle(
                  color: Colors.amber,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ),
        )),
      ],
    );
  }
}

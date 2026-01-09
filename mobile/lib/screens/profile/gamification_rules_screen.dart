import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/constants/gamification_constants.dart';

class GamificationRulesScreen extends StatelessWidget {
  const GamificationRulesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 5,
      child: Scaffold(
        backgroundColor: AppTheme.background,
        appBar: AppBar(
          title: const Text('Gamificação'),
          backgroundColor: AppTheme.background,
          elevation: 0,
          bottom: const TabBar(
            isScrollable: true,
            indicatorColor: AppTheme.primary,
            labelColor: AppTheme.primary,
            unselectedLabelColor: Colors.grey,
            tabs: [
              Tab(text: 'Visão Geral', icon: Icon(Icons.star_outline)),
              Tab(text: 'Níveis', icon: Icon(Icons.trending_up)),
              Tab(text: 'XP', icon: Icon(Icons.bolt)),
              Tab(text: 'Badges', icon: Icon(Icons.workspace_premium_outlined)),
              Tab(text: 'Desafios', icon: Icon(Icons.track_changes_outlined)),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            _OverviewTab(),
            _LevelsTab(),
            _XpTab(),
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
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildMotivationCard(context),
        const SizedBox(height: 16),
        _buildSectionTitle('Como Evoluir?'),
        const SizedBox(height: 8),
        _buildStepCard(
          '1. Use o App',
          'Registre transações, pague contas em dia e mantenha seus orçamentos.',
          Icons.touch_app,
        ),
        _buildStepCard(
          '2. Ganhe XP',
          'Cada ação gera Experiência (XP). Quanto mais XP, maior seu nível.',
          Icons.bolt,
        ),
        _buildStepCard(
          '3. Conquiste Badges',
          'Desbloqueie medalhas exclusivas ao atingir marcos importantes.',
          Icons.workspace_premium,
        ),
      ],
    );
  }

  Widget _buildMotivationCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primary.withOpacity(0.2), Colors.purple.withOpacity(0.1)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          const Icon(Icons.local_fire_department, size: 48, color: Colors.amber),
          const SizedBox(height: 16),
          const Text(
            'Por que Gamificação?',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Estudos mostram que gamificação aumenta o engajamento em até 48%! Ao transformar tarefas financeiras em desafios, você cria hábitos positivos e duradouros. 🚀',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white70, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildStepCard(String title, String description, IconData icon) {
    return Card(
      color: AppTheme.card,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: AppTheme.primary),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        subtitle: Text(description, style: const TextStyle(color: Colors.white70)),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        color: Colors.white,
      ),
    );
  }
}

class _LevelsTab extends StatelessWidget {
  const _LevelsTab();

  @override
  Widget build(BuildContext context) {
    final levels = GamificationConstants.levelNames.entries.toList();
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: levels.length,
      itemBuilder: (context, index) {
        final levelNum = levels[index].key;
        final info = levels[index].value;
        final xpRequired = GamificationConstants.levelThresholds[levelNum - 1]; // Approximate mapping
        final nextXp = levelNum < GamificationConstants.levelThresholds.length 
            ? GamificationConstants.levelThresholds[levelNum] 
            : null;

        return Card(
          color: AppTheme.card,
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
                  ),
                  child: Center(
                    child: Text(
                      info.icon,
                      style: const TextStyle(fontSize: 24),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Nível $levelNum: ${info.name}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        info.title,
                        style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        nextXp != null 
                            ? '$xpRequired - $nextXp XP' 
                            : '$xpRequired+ XP',
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
  }
}

class _XpTab extends StatelessWidget {
  const _XpTab();

  @override
  Widget build(BuildContext context) {
    final rewards = GamificationConstants.xpRewards.entries.toList();

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: rewards.length,
      itemBuilder: (context, index) {
        final item = rewards[index];
        return Card(
          color: AppTheme.card,
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            title: Text(item.key, style: const TextStyle(color: Colors.white)),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '+${item.value} XP',
                style: const TextStyle(
                  color: AppTheme.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _BadgesTab extends StatelessWidget {
  const _BadgesTab();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildBadgeCategory('Iniciante', 'onboarding'),
        _buildBadgeCategory('Consistência', 'consistency'),
        _buildBadgeCategory('Pagamentos', 'payments'),
        _buildBadgeCategory('Economia', 'savings'),
        _buildBadgeCategory('Especiais', 'special'),
      ],
    );
  }

  Widget _buildBadgeCategory(String title, String categoryId) {
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
            childAspectRatio: 0.8,
          ),
          itemCount: badges.length,
          itemBuilder: (context, index) {
            final badge = badges[index];
            final color = GamificationConstants.rarityColors[badge.rarity]!;
            
            return Container(
              decoration: BoxDecoration(
                color: color.bg.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: color.border.withOpacity(0.3)),
              ),
              padding: const EdgeInsets.all(8),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    badge.icon,
                    style: const TextStyle(fontSize: 24),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    badge.name,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: color.text,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    GamificationConstants.getRarityLabel(badge.rarity),
                    style: TextStyle(
                      fontSize: 9,
                      color: Colors.white.withOpacity(0.5),
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
          child: ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(quest.icon, style: const TextStyle(fontSize: 20)),
            ),
            title: Text(quest.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            subtitle: Text(quest.description, style: const TextStyle(color: Colors.white70, fontSize: 12)),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
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

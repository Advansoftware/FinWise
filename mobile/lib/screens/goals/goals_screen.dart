import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/providers/goal_provider.dart';
import 'goal_form_screen.dart';
import 'widgets/widgets.dart';
import '../../core/widgets/skeleton_loading.dart';

class GoalsScreen extends StatefulWidget {
  const GoalsScreen({super.key});

  @override
  State<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends State<GoalsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadGoals();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadGoals() async {
    await context.read<GoalProvider>().loadGoals();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Metas Financeiras'),
        backgroundColor: AppTheme.card,
        foregroundColor: AppTheme.textPrimary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _openGoalForm(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primary,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          tabs: const [
            Tab(text: 'Em Andamento'),
            Tab(text: 'Concluídas'),
          ],
        ),
      ),
      body: Consumer<GoalProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.goals.isEmpty) {
            return const SkeletonGoalList();
          }

          return TabBarView(
            controller: _tabController,
            children: [
              // Em Andamento
              GoalsTab(
                goals: provider.activeGoals,
                summary: provider.summary,
                showSummary: true,
                emptyMessage: 'Nenhuma meta em andamento',
                emptySubMessage:
                    'Crie metas para alcançar seus objetivos financeiros',
                onGoalTap: (goal) => _openGoalForm(goal: goal),
                onAddAmount: (goal) => _showAddAmountDialog(goal),
                onDelete: (goal) => _deleteGoal(goal),
                onRefresh: _loadGoals,
              ),
              // Concluídas
              GoalsTab(
                goals: provider.completedGoals,
                showSummary: false,
                emptyMessage: 'Nenhuma meta concluída',
                emptySubMessage: 'Continue trabalhando nas suas metas!',
                onGoalTap: (goal) => _openGoalForm(goal: goal),
                onDelete: (goal) => _deleteGoal(goal),
                onRefresh: _loadGoals,
              ),
            ],
          );
        },
      ),
    );
  }

  void _openGoalForm({GoalModel? goal}) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => GoalFormScreen(goal: goal),
      ),
    );

    if (result == true) {
      _loadGoals();
    }
  }

  void _showAddAmountDialog(GoalModel goal) async {
    final result = await showDialog<double>(
      context: context,
      builder: (context) => AddAmountDialog(goal: goal),
    );

    if (result != null && mounted) {
      await context.read<GoalProvider>().addToGoal(goal.id, result);
    }
  }

  void _deleteGoal(GoalModel goal) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text(
          'Excluir Meta',
          style: TextStyle(color: AppTheme.textPrimary),
        ),
        content: Text(
          'Tem certeza que deseja excluir a meta "${goal.name}"?',
          style: const TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.error),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await context.read<GoalProvider>().deleteGoal(goal.id);
    }
  }
}

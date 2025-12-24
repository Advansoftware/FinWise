import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/utils/format_utils.dart';
import '../../core/providers/goal_provider.dart';
import 'goal_form_screen.dart';

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
            return const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            );
          }

          return TabBarView(
            controller: _tabController,
            children: [
              // Em Andamento
              _GoalsTab(
                goals: provider.activeGoals,
                summary: provider.summary,
                showSummary: true,
                emptyMessage: 'Nenhuma meta em andamento',
                emptySubMessage: 'Crie metas para alcançar seus objetivos financeiros',
                onGoalTap: (goal) => _openGoalForm(goal: goal),
                onAddAmount: (goal) => _showAddAmountDialog(goal),
                onDelete: (goal) => _deleteGoal(goal),
                onRefresh: _loadGoals,
              ),
              // Concluídas
              _GoalsTab(
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
    final controller = TextEditingController();
    final remaining = goal.targetAmount - goal.currentAmount;

    final result = await showDialog<double>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text(
          'Adicionar Valor',
          style: TextStyle(color: AppTheme.textPrimary),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Faltam ${FormatUtils.formatCurrency(remaining)} para completar "${goal.name}"',
              style: const TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              autofocus: true,
              style: const TextStyle(color: AppTheme.textPrimary),
              decoration: InputDecoration(
                prefixText: 'R\$ ',
                prefixStyle: const TextStyle(color: AppTheme.textPrimary),
                hintText: '0,00',
                hintStyle: const TextStyle(color: AppTheme.textSecondary),
                filled: true,
                fillColor: AppTheme.cardLight,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              final amount =
                  double.tryParse(controller.text.replaceAll(',', '.'));
              if (amount != null && amount > 0) {
                Navigator.pop(context, amount);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
            ),
            child: const Text('Adicionar'),
          ),
        ],
      ),
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

class _GoalsTab extends StatelessWidget {
  final List<GoalModel> goals;
  final GoalsSummary? summary;
  final bool showSummary;
  final String emptyMessage;
  final String emptySubMessage;
  final Function(GoalModel) onGoalTap;
  final Function(GoalModel)? onAddAmount;
  final Function(GoalModel) onDelete;
  final Future<void> Function() onRefresh;

  const _GoalsTab({
    required this.goals,
    this.summary,
    required this.showSummary,
    required this.emptyMessage,
    required this.emptySubMessage,
    required this.onGoalTap,
    this.onAddAmount,
    required this.onDelete,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (goals.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withAlpha(51),
                  borderRadius: BorderRadius.circular(40),
                ),
                child: const Icon(
                  Icons.flag_outlined,
                  size: 40,
                  color: AppTheme.primary,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                emptyMessage,
                style: const TextStyle(
                  color: AppTheme.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                emptySubMessage,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppTheme.primary,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Resumo
          if (showSummary && summary != null) ...[
            _SummaryCard(summary: summary!),
            const SizedBox(height: 16),
          ],

          // Lista de metas
          ...goals.map((goal) => _GoalCard(
                goal: goal,
                onTap: () => onGoalTap(goal),
                onAddAmount:
                    onAddAmount != null ? () => onAddAmount!(goal) : null,
                onDelete: () => onDelete(goal),
              )),
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final GoalsSummary summary;

  const _SummaryCard({required this.summary});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Progresso Geral',
                style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 14,
                ),
              ),
              Text(
                '${summary.overallProgress.toStringAsFixed(1)}%',
                style: const TextStyle(
                  color: AppTheme.primary,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (summary.overallProgress / 100).clamp(0, 1),
              backgroundColor: AppTheme.cardLight,
              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
              minHeight: 8,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _SummaryItem(
                  label: 'Objetivo Total',
                  value: FormatUtils.formatCurrency(summary.totalTarget),
                  color: AppTheme.textPrimary,
                ),
              ),
              Expanded(
                child: _SummaryItem(
                  label: 'Acumulado',
                  value: FormatUtils.formatCurrency(summary.totalCurrent),
                  color: AppTheme.success,
                ),
              ),
              Expanded(
                child: _SummaryItem(
                  label: 'Faltam',
                  value: FormatUtils.formatCurrency(summary.remaining),
                  color: AppTheme.warning,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SummaryItem extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _SummaryItem({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            color: AppTheme.textSecondary,
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 13,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}

class _GoalCard extends StatelessWidget {
  final GoalModel goal;
  final VoidCallback onTap;
  final VoidCallback? onAddAmount;
  final VoidCallback onDelete;

  const _GoalCard({
    required this.goal,
    required this.onTap,
    this.onAddAmount,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final progress = goal.targetAmount > 0
        ? (goal.currentAmount / goal.targetAmount * 100)
        : 0.0;
    final isCompleted = goal.currentAmount >= goal.targetAmount;
    final remaining = goal.targetAmount - goal.currentAmount;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border:
            isCompleted ? Border.all(color: AppTheme.success.withAlpha(102)) : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: (isCompleted
                                ? AppTheme.success
                                : AppTheme.primary)
                            .withAlpha(51),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Icon(
                        isCompleted ? Icons.emoji_events : Icons.flag,
                        color: isCompleted ? AppTheme.success : AppTheme.primary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            goal.name,
                            style: const TextStyle(
                              color: AppTheme.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (goal.targetDate != null)
                            Text(
                              'Meta: ${FormatUtils.formatDate(goal.targetDate!)}',
                              style: const TextStyle(
                                color: AppTheme.textSecondary,
                                fontSize: 12,
                              ),
                            ),
                        ],
                      ),
                    ),
                    if (isCompleted)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.success.withAlpha(51),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          '✓ Concluída',
                          style: TextStyle(
                            color: AppTheme.success,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                  ],
                ),

                const SizedBox(height: 16),

                // Progress bar
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: (progress / 100).clamp(0, 1),
                    backgroundColor: AppTheme.cardLight,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      isCompleted ? AppTheme.success : AppTheme.primary,
                    ),
                    minHeight: 8,
                  ),
                ),

                const SizedBox(height: 12),

                // Values
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          FormatUtils.formatCurrency(goal.currentAmount),
                          style: TextStyle(
                            color: isCompleted
                                ? AppTheme.success
                                : AppTheme.primary,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'de ${FormatUtils.formatCurrency(goal.targetAmount)}',
                          style: const TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${progress.toStringAsFixed(1)}%',
                          style: TextStyle(
                            color: isCompleted
                                ? AppTheme.success
                                : AppTheme.primary,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (!isCompleted)
                          Text(
                            'Faltam ${FormatUtils.formatCurrency(remaining)}',
                            style: const TextStyle(
                              color: AppTheme.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),

                // Actions
                if (!isCompleted && onAddAmount != null) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: onAddAmount,
                          icon: const Icon(Icons.add, size: 18),
                          label: const Text('Adicionar Valor'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.primary,
                            side: const BorderSide(color: AppTheme.primary),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, size: 20),
                        color: AppTheme.textSecondary,
                        onPressed: onDelete,
                      ),
                    ],
                  ),
                ] else if (isCompleted) ...[
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerRight,
                    child: IconButton(
                      icon: const Icon(Icons.delete_outline, size: 20),
                      color: AppTheme.textSecondary,
                      onPressed: onDelete,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

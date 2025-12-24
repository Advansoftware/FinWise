import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/utils/format_utils.dart';
import '../../core/providers/budget_provider.dart';
import 'budget_form_screen.dart';

class BudgetsScreen extends StatefulWidget {
  const BudgetsScreen({super.key});

  @override
  State<BudgetsScreen> createState() => _BudgetsScreenState();
}

class _BudgetsScreenState extends State<BudgetsScreen> {
  int _selectedMonth = DateTime.now().month;
  int _selectedYear = DateTime.now().year;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadBudgets();
    });
  }

  Future<void> _loadBudgets() async {
    await context.read<BudgetProvider>().loadBudgets(
          month: _selectedMonth,
          year: _selectedYear,
        );
  }

  void _changeMonth(int delta) {
    setState(() {
      _selectedMonth += delta;
      if (_selectedMonth > 12) {
        _selectedMonth = 1;
        _selectedYear++;
      } else if (_selectedMonth < 1) {
        _selectedMonth = 12;
        _selectedYear--;
      }
    });
    _loadBudgets();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Orçamentos'),
        backgroundColor: AppTheme.card,
        foregroundColor: AppTheme.textPrimary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _openBudgetForm(),
          ),
        ],
      ),
      body: Consumer<BudgetProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.budgets.isEmpty) {
            return const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            );
          }

          return RefreshIndicator(
            onRefresh: _loadBudgets,
            color: AppTheme.primary,
            child: CustomScrollView(
              slivers: [
                // Seletor de mês
                SliverToBoxAdapter(
                  child: _MonthSelector(
                    month: _selectedMonth,
                    year: _selectedYear,
                    onPrevious: () => _changeMonth(-1),
                    onNext: () => _changeMonth(1),
                  ),
                ),

                // Resumo
                SliverToBoxAdapter(
                  child: _SummarySection(summary: provider.summary),
                ),

                // Lista de orçamentos
                if (provider.budgets.isEmpty)
                  SliverFillRemaining(
                    child: _EmptyState(
                      onAddBudget: () => _openBudgetForm(),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.all(16),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final budget = provider.budgets[index];
                          return _BudgetCard(
                            budget: budget,
                            onTap: () => _openBudgetForm(budget: budget),
                            onDelete: () => _deleteBudget(budget),
                          );
                        },
                        childCount: provider.budgets.length,
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _openBudgetForm({BudgetModel? budget}) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => BudgetFormScreen(budget: budget),
      ),
    );

    if (result == true) {
      _loadBudgets();
    }
  }

  void _deleteBudget(BudgetModel budget) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text(
          'Excluir Orçamento',
          style: TextStyle(color: AppTheme.textPrimary),
        ),
        content: Text(
          'Tem certeza que deseja excluir o orçamento "${budget.category}"?',
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
      await context.read<BudgetProvider>().deleteBudget(budget.id);
    }
  }
}

class _MonthSelector extends StatelessWidget {
  final int month;
  final int year;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  const _MonthSelector({
    required this.month,
    required this.year,
    required this.onPrevious,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    final months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro'
    ];

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left, color: AppTheme.textPrimary),
            onPressed: onPrevious,
          ),
          Text(
            '${months[month - 1]} $year',
            style: const TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right, color: AppTheme.textPrimary),
            onPressed: onNext,
          ),
        ],
      ),
    );
  }
}

class _SummarySection extends StatelessWidget {
  final BudgetSummary summary;

  const _SummarySection({required this.summary});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Card de progresso geral
          Container(
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
                      'Uso Total',
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      '${summary.usagePercentage.toStringAsFixed(1)}%',
                      style: TextStyle(
                        color: summary.usagePercentage > 100
                            ? AppTheme.error
                            : summary.usagePercentage > 80
                                ? AppTheme.warning
                                : AppTheme.success,
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
                    value: (summary.usagePercentage / 100).clamp(0, 1),
                    backgroundColor: AppTheme.cardLight,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      summary.usagePercentage > 100
                          ? AppTheme.error
                          : summary.usagePercentage > 80
                              ? AppTheme.warning
                              : AppTheme.success,
                    ),
                    minHeight: 8,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _SummaryItem(
                        label: 'Orçado',
                        value: FormatUtils.formatCurrency(summary.totalBudget),
                        color: AppTheme.primary,
                      ),
                    ),
                    Expanded(
                      child: _SummaryItem(
                        label: 'Gasto',
                        value: FormatUtils.formatCurrency(summary.totalSpent),
                        color: AppTheme.error,
                      ),
                    ),
                    Expanded(
                      child: _SummaryItem(
                        label: 'Restante',
                        value: FormatUtils.formatCurrency(summary.remaining),
                        color: summary.remaining >= 0
                            ? AppTheme.success
                            : AppTheme.error,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Status cards
          Row(
            children: [
              Expanded(
                child: _StatusCard(
                  icon: Icons.check_circle_outline,
                  label: 'No Limite',
                  count: summary.onTrackCount,
                  color: AppTheme.success,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatusCard(
                  icon: Icons.warning_amber_outlined,
                  label: 'Estourado',
                  count: summary.overBudgetCount,
                  color: AppTheme.error,
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
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}

class _StatusCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final int count;
  final Color color;

  const _StatusCard({
    required this.icon,
    required this.label,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                count.toString(),
                style: TextStyle(
                  color: color,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                label,
                style: const TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BudgetCard extends StatelessWidget {
  final BudgetModel budget;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _BudgetCard({
    required this.budget,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isOverBudget = budget.percentUsed > 100;
    final isWarning = budget.percentUsed > 80 && !isOverBudget;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: isOverBudget
            ? Border.all(color: AppTheme.error.withAlpha(102))
            : null,
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
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: _getCategoryColor(budget.category).withAlpha(51),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        _getCategoryIcon(budget.category),
                        color: _getCategoryColor(budget.category),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            budget.category,
                            style: const TextStyle(
                              color: AppTheme.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (budget.name != null && budget.name!.isNotEmpty)
                            Text(
                              budget.name!,
                              style: const TextStyle(
                                color: AppTheme.textSecondary,
                                fontSize: 12,
                              ),
                            ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, size: 20),
                      color: AppTheme.textSecondary,
                      onPressed: onDelete,
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Progress bar
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: (budget.percentUsed / 100).clamp(0, 1),
                    backgroundColor: AppTheme.cardLight,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      isOverBudget
                          ? AppTheme.error
                          : isWarning
                              ? AppTheme.warning
                              : AppTheme.success,
                    ),
                    minHeight: 8,
                  ),
                ),

                const SizedBox(height: 12),

                // Values
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${FormatUtils.formatCurrency(budget.spent)} de ${FormatUtils.formatCurrency(budget.amount)}',
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: (isOverBudget
                                ? AppTheme.error
                                : isWarning
                                    ? AppTheme.warning
                                    : AppTheme.success)
                            .withAlpha(51),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${budget.percentUsed.toStringAsFixed(1)}%',
                        style: TextStyle(
                          color: isOverBudget
                              ? AppTheme.error
                              : isWarning
                                  ? AppTheme.warning
                                  : AppTheme.success,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),

                // Remaining
                if (budget.remaining >= 0)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'Restam ${FormatUtils.formatCurrency(budget.remaining)}',
                      style: const TextStyle(
                        color: AppTheme.success,
                        fontSize: 12,
                      ),
                    ),
                  )
                else
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'Excedido em ${FormatUtils.formatCurrency(-budget.remaining)}',
                      style: const TextStyle(
                        color: AppTheme.error,
                        fontSize: 12,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    final icons = {
      'Alimentação': Icons.restaurant,
      'Transporte': Icons.directions_car,
      'Moradia': Icons.home,
      'Saúde': Icons.medical_services,
      'Educação': Icons.school,
      'Lazer': Icons.sports_esports,
      'Compras': Icons.shopping_bag,
      'Serviços': Icons.build,
    };
    return icons[category] ?? Icons.category;
  }

  Color _getCategoryColor(String category) {
    final colors = {
      'Alimentação': Colors.orange,
      'Transporte': Colors.blue,
      'Moradia': Colors.purple,
      'Saúde': Colors.red,
      'Educação': Colors.green,
      'Lazer': Colors.pink,
      'Compras': Colors.amber,
      'Serviços': Colors.teal,
    };
    return colors[category] ?? AppTheme.primary;
  }
}

class _EmptyState extends StatelessWidget {
  final VoidCallback onAddBudget;

  const _EmptyState({required this.onAddBudget});

  @override
  Widget build(BuildContext context) {
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
                Icons.pie_chart_outline,
                size: 40,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Nenhum orçamento definido',
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Crie orçamentos para controlar seus gastos por categoria',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: onAddBudget,
              icon: const Icon(Icons.add),
              label: const Text('Criar Orçamento'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

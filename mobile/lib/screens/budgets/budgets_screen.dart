import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/providers/budget_provider.dart';
import 'budget_form_screen.dart';
import 'widgets/widgets.dart';
import '../../core/widgets/skeleton_loading.dart';

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
            return const SkeletonBudgetList();
          }

          return RefreshIndicator(
            onRefresh: _loadBudgets,
            color: AppTheme.primary,
            child: CustomScrollView(
              slivers: [
                // Seletor de mês
                SliverToBoxAdapter(
                  child: MonthSelector(
                    month: _selectedMonth,
                    year: _selectedYear,
                    onPrevious: () => _changeMonth(-1),
                    onNext: () => _changeMonth(1),
                  ),
                ),

                // Resumo
                SliverToBoxAdapter(
                  child: BudgetSummarySection(summary: provider.summary),
                ),

                // Lista de orçamentos
                if (provider.budgets.isEmpty)
                  SliverFillRemaining(
                    child: BudgetEmptyState(
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
                          return BudgetCard(
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

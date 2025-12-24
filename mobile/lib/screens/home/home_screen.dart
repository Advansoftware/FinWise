import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/utils/format_utils.dart';
import '../../core/providers/providers.dart';
import '../../core/widgets/ai_chat_fab.dart';
import '../../core/widgets/compact_add_button.dart';
import '../../core/widgets/skeleton_loading.dart';
import '../budgets/budgets_screen.dart';
import '../goals/goals_screen.dart';
import '../transactions/transactions_screen.dart';
import '../transactions/transaction_form_screen.dart';
import '../wallets/wallets_screen.dart';
import '../profile/profile_screen.dart';
import '../more/more_screen.dart';
import '../installments/installments_screen.dart';
import '../receipts/receipt_scanner_screen.dart';
import 'widgets/stats_widgets.dart';
import 'widgets/gamification_widgets.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadInitialData();
    });
  }

  Future<void> _loadInitialData() async {
    if (!mounted || _isLoading) return;
    
    setState(() => _isLoading = true);
    
    try {
      final transactionProvider = context.read<TransactionProvider>();
      final walletProvider = context.read<WalletProvider>();
      final gamificationProvider = context.read<GamificationProvider>();
      
      await Future.wait([
        transactionProvider.loadTransactions(),
        walletProvider.loadWallets(),
        gamificationProvider.loadGamification(),
      ]);
    } catch (e) {
      debugPrint('Erro ao carregar dados: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Widget _buildScreen(int index) {
    switch (index) {
      case 0:
        return const _DashboardTab();
      case 1:
        return const TransactionsScreen();
      case 2:
        return const InstallmentsScreen();
      case 3:
        return const WalletsScreen();
      case 4:
        return const MoreScreen();
      default:
        return const _DashboardTab();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _buildScreen(_selectedIndex),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() => _selectedIndex = index);
        },
        backgroundColor: AppTheme.card,
        indicatorColor: AppTheme.primary.withAlpha(51),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard, color: AppTheme.primary),
            label: 'Início',
          ),
          NavigationDestination(
            icon: Icon(Icons.swap_horiz_outlined),
            selectedIcon: Icon(Icons.swap_horiz, color: AppTheme.primary),
            label: 'Transações',
          ),
          NavigationDestination(
            icon: Icon(Icons.credit_card_outlined),
            selectedIcon: Icon(Icons.credit_card, color: AppTheme.primary),
            label: 'Parcelas',
          ),
          NavigationDestination(
            icon: Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: Icon(Icons.account_balance_wallet, color: AppTheme.primary),
            label: 'Carteiras',
          ),
          NavigationDestination(
            icon: Icon(Icons.menu_outlined),
            selectedIcon: Icon(Icons.menu, color: AppTheme.primary),
            label: 'Mais',
          ),
        ],
      ),
      // FAB de Chat com IA
      floatingActionButton: const AIChatFabSimple(),
    );
  }
}

class _DashboardTab extends StatefulWidget {
  const _DashboardTab();

  @override
  State<_DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<_DashboardTab> {
  DateTime? _startDate;
  DateTime? _endDate;
  String? _selectedCategory;
  String? _selectedSubcategory;
  bool _showFilters = false;

  final List<String> _categories = [
    'Todas',
    'Supermercado',
    'Transporte',
    'Alimentação',
    'Entretenimento',
    'Saúde',
    'Educação',
    'Moradia',
    'Contas',
    'Lazer',
    'Vestuário',
    'Salário',
    'Investimentos',
    'Outros',
  ];

  @override
  void initState() {
    super.initState();
    // Define período padrão: mês atual
    final now = DateTime.now();
    _startDate = DateTime(now.year, now.month, 1);
    _endDate = DateTime(now.year, now.month + 1, 0);
  }

  List<TransactionModel> _filterTransactions(List<TransactionModel> transactions) {
    return transactions.where((t) {
      // Filtro por data
      if (_startDate != null && t.date.isBefore(_startDate!)) return false;
      if (_endDate != null && t.date.isAfter(_endDate!)) return false;

      // Filtro por categoria
      if (_selectedCategory != null && 
          _selectedCategory != 'Todas' && 
          t.category != _selectedCategory) {
        return false;
      }

      // TODO: Adicionar filtro por subcategoria quando o modelo suportar
      // if (_selectedSubcategory != null && 
      //     _selectedSubcategory != 'Todas' &&
      //     t.subcategory != _selectedSubcategory) {
      //   return false;
      // }

      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final transactionProvider = context.watch<TransactionProvider>();
    final walletProvider = context.watch<WalletProvider>();

    final user = authProvider.user;
    final allTransactions = transactionProvider.transactions;
    final transactions = _filterTransactions(allTransactions);
    final wallets = walletProvider.wallets;

    final totalBalance = wallets.fold<double>(0, (sum, w) => sum + w.balance);
    final totalIncome = transactions
        .where((t) => t.type == TransactionType.income)
        .fold<double>(0, (sum, t) => sum + t.amount);
    final totalExpense = transactions
        .where((t) => t.type == TransactionType.expense)
        .fold<double>(0, (sum, t) => sum + t.amount);

    final categoryData = <String, double>{};
    for (var t in transactions.where((t) => t.type == TransactionType.expense)) {
      final cat = t.category ?? 'Outros';
      categoryData[cat] = (categoryData[cat] ?? 0) + t.amount;
    }

    final incomeSparkline = transactions
        .where((t) => t.type == TransactionType.income)
        .take(7)
        .map((t) => t.amount)
        .toList();
    final expenseSparkline = transactions
        .where((t) => t.type == TransactionType.expense)
        .take(7)
        .map((t) => t.amount)
        .toList();

    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait([
          transactionProvider.loadTransactions(),
          walletProvider.loadWallets(),
          context.read<GamificationProvider>().refresh(),
        ]);
      },
      color: AppTheme.primary,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverAppBar(
            expandedHeight: _showFilters ? 200 : 100,
            floating: true,
            pinned: true,
            backgroundColor: AppTheme.background,
            actions: [
              IconButton(
                onPressed: () => setState(() => _showFilters = !_showFilters),
                icon: Icon(
                  _showFilters ? Icons.filter_alt : Icons.filter_alt_outlined,
                  color: _showFilters ? AppTheme.primary : Colors.white70,
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppTheme.primary.withAlpha(25),
                      AppTheme.background,
                    ],
                  ),
                ),
              ),
              title: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Olá, ${user?.displayName?.split(' ').first ?? 'Usuário'}!',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    FormatUtils.formatDateFull(DateTime.now()),
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.white.withAlpha(153),
                    ),
                  ),
                ],
              ),
              titlePadding: const EdgeInsets.only(left: 16, bottom: 12),
            ),
          ),
          // Filtros (expansíveis)
          if (_showFilters)
            SliverToBoxAdapter(
              child: _FiltersSection(
                startDate: _startDate,
                endDate: _endDate,
                selectedCategory: _selectedCategory,
                categories: _categories,
                onStartDateChanged: (d) => setState(() => _startDate = d),
                onEndDateChanged: (d) => setState(() => _endDate = d),
                onCategoryChanged: (c) => setState(() {
                  _selectedCategory = c;
                  _selectedSubcategory = null;
                }),
                onClear: () => setState(() {
                  final now = DateTime.now();
                  _startDate = DateTime(now.year, now.month, 1);
                  _endDate = DateTime(now.year, now.month + 1, 0);
                  _selectedCategory = null;
                  _selectedSubcategory = null;
                }),
              ),
            ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Botões de ação (Escanear Nota + Adicionar Transação)
                Row(
                  children: [
                    // Botão Escanear Nota
                    Expanded(
                      child: _ScanReceiptButton(
                        onPressed: () async {
                          final result = await ReceiptScannerScreen.show(context);
                          if (result != null && result.success && context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Nota escaneada: ${result.items.length} itens de ${result.establishment ?? "Estabelecimento"}',
                                ),
                                backgroundColor: AppTheme.success,
                              ),
                            );
                            transactionProvider.loadTransactions(refresh: true);
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Botão Adicionar Transação
                    AddTransactionButton(
                      isCompact: true,
                      onPressed: () async {
                        final result = await Navigator.of(context).push<bool>(
                          PageRouteBuilder(
                            pageBuilder: (context, animation, secondaryAnimation) =>
                                const TransactionFormScreen(),
                            transitionsBuilder: (context, animation, secondaryAnimation, child) {
                              return SlideTransition(
                                position: Tween<Offset>(
                                  begin: const Offset(0, 1),
                                  end: Offset.zero,
                                ).animate(CurvedAnimation(
                                  parent: animation,
                                  curve: Curves.easeOutCubic,
                                )),
                                child: child,
                              );
                            },
                          ),
                        );
                        if (result == true) {
                          transactionProvider.loadTransactions(refresh: true);
                        }
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const GamificationSection(),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: StatsCard(
                        title: 'Saldo Total',
                        value: FormatUtils.formatCurrency(totalBalance),
                        icon: Icons.account_balance_wallet,
                        iconColor: AppTheme.primary,
                        valueColor: totalBalance >= 0 
                            ? Colors.white 
                            : AppTheme.error,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: StatsCard(
                        title: 'Balanço',
                        value: FormatUtils.formatCurrency(totalIncome - totalExpense),
                        icon: Icons.trending_up,
                        iconColor: (totalIncome - totalExpense) >= 0 
                            ? AppTheme.success 
                            : AppTheme.error,
                        valueColor: (totalIncome - totalExpense) >= 0 
                            ? AppTheme.success 
                            : AppTheme.error,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: StatsCard(
                        title: 'Receitas',
                        value: '+ ${FormatUtils.formatCurrency(totalIncome)}',
                        icon: Icons.arrow_upward,
                        iconColor: AppTheme.success,
                        valueColor: AppTheme.success,
                        sparklineData: incomeSparkline.isNotEmpty ? incomeSparkline : null,
                        isPositive: true,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: StatsCard(
                        title: 'Despesas',
                        value: '- ${FormatUtils.formatCurrency(totalExpense)}',
                        icon: Icons.arrow_downward,
                        iconColor: AppTheme.error,
                        valueColor: AppTheme.error,
                        sparklineData: expenseSparkline.isNotEmpty ? expenseSparkline : null,
                        isPositive: false,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SpendingByCategoryChart(categoryData: categoryData),
                const SizedBox(height: 16),
                if (transactions.isNotEmpty)
                  MonthlySpendingChart(transactions: transactions),
                if (transactions.isNotEmpty) 
                  const SizedBox(height: 16),
                const DailyQuestsSection(),
                const SizedBox(height: 16),
                // Cards de acesso rápido para Orçamentos e Metas
                _QuickAccessSection(
                  onBudgetsTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const BudgetsScreen()),
                  ),
                  onGoalsTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const GoalsScreen()),
                  ),
                ),
                const SizedBox(height: 16),
                _RecentTransactionsSection(
                  transactions: transactions.take(5).toList(),
                ),
                const SizedBox(height: 80),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _RecentTransactionsSection extends StatelessWidget {
  final List<TransactionModel> transactions;

  const _RecentTransactionsSection({required this.transactions});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Transações Recentes',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              TextButton(
                onPressed: () {},
                child: const Text(
                  'Ver todas',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.primary,
                  ),
                ),
              ),
            ],
          ),
          if (transactions.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.receipt_long_outlined,
                      size: 40,
                      color: Colors.white.withOpacity(0.3),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Nenhuma transação encontrada',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.5),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            ...transactions.map((t) => _TransactionItem(transaction: t)),
        ],
      ),
    );
  }
}

class _QuickAccessSection extends StatelessWidget {
  final VoidCallback onBudgetsTap;
  final VoidCallback onGoalsTap;

  const _QuickAccessSection({
    required this.onBudgetsTap,
    required this.onGoalsTap,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _QuickAccessCard(
            icon: Icons.pie_chart_outline,
            label: 'Orçamentos',
            description: 'Controle de gastos',
            color: Colors.orange,
            onTap: onBudgetsTap,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _QuickAccessCard(
            icon: Icons.flag_outlined,
            label: 'Metas',
            description: 'Objetivos financeiros',
            color: Colors.green,
            onTap: onGoalsTap,
          ),
        ),
      ],
    );
  }
}

class _QuickAccessCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String description;
  final Color color;
  final VoidCallback onTap;

  const _QuickAccessCard({
    required this.icon,
    required this.label,
    required this.description,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppTheme.card,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color.withAlpha(51),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 24,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(
                  color: Colors.white.withAlpha(128),
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Icon(
                    Icons.arrow_forward,
                    size: 18,
                    color: color,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TransactionItem extends StatelessWidget {
  final TransactionModel transaction;

  const _TransactionItem({required this.transaction});

  IconData _getCategoryIcon() {
    switch (transaction.category?.toLowerCase()) {
      case 'alimentação':
      case 'supermercado':
        return Icons.restaurant;
      case 'transporte':
        return Icons.directions_car;
      case 'lazer':
        return Icons.sports_esports;
      case 'saúde':
        return Icons.favorite;
      case 'educação':
        return Icons.school;
      case 'moradia':
        return Icons.home;
      case 'transferência':
        return Icons.swap_horiz;
      case 'investimentos':
        return Icons.trending_up;
      default:
        return Icons.receipt;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isExpense = transaction.type == TransactionType.expense;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: AppTheme.border.withAlpha(128),
          ),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: (isExpense ? AppTheme.error : AppTheme.success)
                  .withAlpha(25),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              _getCategoryIcon(),
              size: 18,
              color: isExpense ? AppTheme.error : AppTheme.success,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transaction.description,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Colors.white,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '${transaction.category ?? 'Outros'} • ${FormatUtils.formatDateShort(transaction.date)}',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.white.withAlpha(128),
                  ),
                ),
              ],
            ),
          ),
          Text(
            '${isExpense ? '-' : '+'} ${FormatUtils.formatCurrency(transaction.amount)}',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isExpense ? AppTheme.error : AppTheme.success,
            ),
          ),
        ],
      ),
    );
  }
}

/// Seção de filtros do Dashboard
class _FiltersSection extends StatelessWidget {
  final DateTime? startDate;
  final DateTime? endDate;
  final String? selectedCategory;
  final List<String> categories;
  final void Function(DateTime?) onStartDateChanged;
  final void Function(DateTime?) onEndDateChanged;
  final void Function(String?) onCategoryChanged;
  final VoidCallback onClear;

  const _FiltersSection({
    required this.startDate,
    required this.endDate,
    required this.selectedCategory,
    required this.categories,
    required this.onStartDateChanged,
    required this.onEndDateChanged,
    required this.onCategoryChanged,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        border: Border(bottom: BorderSide(color: AppTheme.border)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Filtros',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              TextButton.icon(
                onPressed: onClear,
                icon: const Icon(Icons.refresh, size: 16),
                label: const Text('Limpar'),
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.primary,
                  padding: EdgeInsets.zero,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Filtros de data
          Row(
            children: [
              Expanded(
                child: _DateFilterButton(
                  label: 'De',
                  date: startDate,
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: startDate ?? DateTime.now(),
                      firstDate: DateTime(2020),
                      lastDate: DateTime(2030),
                      builder: (context, child) {
                        return Theme(
                          data: Theme.of(context).copyWith(
                            colorScheme: const ColorScheme.dark(
                              primary: AppTheme.primary,
                              surface: AppTheme.card,
                            ),
                          ),
                          child: child!,
                        );
                      },
                    );
                    if (date != null) onStartDateChanged(date);
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _DateFilterButton(
                  label: 'Até',
                  date: endDate,
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: endDate ?? DateTime.now(),
                      firstDate: DateTime(2020),
                      lastDate: DateTime(2030),
                      builder: (context, child) {
                        return Theme(
                          data: Theme.of(context).copyWith(
                            colorScheme: const ColorScheme.dark(
                              primary: AppTheme.primary,
                              surface: AppTheme.card,
                            ),
                          ),
                          child: child!,
                        );
                      },
                    );
                    if (date != null) onEndDateChanged(date);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Filtro de categoria
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: AppTheme.background,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.border),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: selectedCategory,
                hint: const Text(
                  'Todas as categorias',
                  style: TextStyle(color: Colors.white54, fontSize: 13),
                ),
                isExpanded: true,
                dropdownColor: AppTheme.card,
                icon: const Icon(Icons.arrow_drop_down, color: Colors.white54),
                items: categories.map((cat) {
                  return DropdownMenuItem(
                    value: cat == 'Todas' ? null : cat,
                    child: Text(
                      cat,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                    ),
                  );
                }).toList(),
                onChanged: onCategoryChanged,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DateFilterButton extends StatelessWidget {
  final String label;
  final DateTime? date;
  final VoidCallback onTap;

  const _DateFilterButton({
    required this.label,
    required this.date,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: AppTheme.background,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            const Icon(Icons.calendar_today, size: 16, color: Colors.white54),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(fontSize: 10, color: Colors.white54),
                ),
                Text(
                  date != null
                      ? '${date!.day.toString().padLeft(2, '0')}/${date!.month.toString().padLeft(2, '0')}'
                      : '--/--',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================================
// Scan Receipt Button
// ============================================================================

class _ScanReceiptButton extends StatelessWidget {
  final VoidCallback onPressed;

  const _ScanReceiptButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: AppTheme.warning.withAlpha(25),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.warning.withAlpha(77)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.qr_code_scanner, size: 20, color: AppTheme.warning),
              const SizedBox(width: 8),
              Text(
                'Escanear Nota',
                style: TextStyle(
                  color: AppTheme.warning,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

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
import 'widgets/widgets.dart';

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
      floatingActionButton: const AIChatFab(),
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
              child: DashboardFiltersSection(
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
                      child: ScanReceiptButton(
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
                // 1. Visão Geral (Chart) - Topo como na Web
                if (transactions.isNotEmpty)
                  OverviewSpendingChart(transactions: transactions),
                if (transactions.isNotEmpty) const SizedBox(height: 16),

                // 2. Transações Recentes
                RecentTransactionsSection(
                  transactions: transactions.take(5).toList(),
                ),
                const SizedBox(height: 16),

                // 3. Gamification (Nível/Badges)
                const GamificationSection(),
                const SizedBox(height: 16),

                // 4. Carteira Consolidada (Detalhes ricos)
                ConsolidatedWalletCard(
                  totalBalance: totalBalance,
                  totalIncome: totalIncome,
                  totalExpense: totalExpense,
                  transactions: transactions,
                ),
                const SizedBox(height: 16),

                // 5. Missões
                const DailyQuestsSection(),
                const SizedBox(height: 16),

                // 6. Dica IA
                AIInsightCard(
                  onRefresh: () {
                    // TODO: Refresh insight
                  },
                ),
                const SizedBox(height: 16),

                // 7. Metas e Orçamentos
                QuickAccessSection(
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

                // Gráfico de Pizza (Secundário)
                SpendingByCategoryChart(categoryData: categoryData),
                const SizedBox(height: 80),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

// Classes removidas (Extraídas para widgets/):
// _RecentTransactionsSection -> RecentTransactionsSection
// _QuickAccessSection -> QuickAccessSection
// _QuickAccessCard -> QuickAccessCard (interno)
// _TransactionItem -> TransactionItem
// _FiltersSection -> DashboardFiltersSection
// _DateFilterButton -> DateFilterButton (interno)
// _ScanReceiptButton -> ScanReceiptButton

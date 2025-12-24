import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/utils/format_utils.dart';
import '../../core/providers/providers.dart';
import '../transactions/transactions_screen.dart';
import '../wallets/wallets_screen.dart';
import '../profile/profile_screen.dart';
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
        return const WalletsScreen();
      case 3:
        return const ProfileScreen();
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
        indicatorColor: AppTheme.primary.withOpacity(0.2),
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
            icon: Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: Icon(Icons.account_balance_wallet, color: AppTheme.primary),
            label: 'Carteiras',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: AppTheme.primary),
            label: 'Perfil',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Nova transação - Em breve!')),
          );
        },
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}

class _DashboardTab extends StatelessWidget {
  const _DashboardTab();

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final transactionProvider = context.watch<TransactionProvider>();
    final walletProvider = context.watch<WalletProvider>();

    final user = authProvider.user;
    final transactions = transactionProvider.transactions;
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
            expandedHeight: 100,
            floating: true,
            pinned: true,
            backgroundColor: AppTheme.background,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppTheme.primary.withOpacity(0.1),
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
                      color: Colors.white.withOpacity(0.6),
                    ),
                  ),
                ],
              ),
              titlePadding: const EdgeInsets.only(left: 16, bottom: 12),
            ),
            actions: [
              IconButton(
                onPressed: () async {
                  await context.read<AuthProvider>().logout();
                },
                icon: Icon(
                  Icons.logout,
                  color: Colors.white.withOpacity(0.7),
                ),
              ),
              const SizedBox(width: 8),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
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
            color: AppTheme.border.withOpacity(0.5),
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
                  .withOpacity(0.1),
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
                    color: Colors.white.withOpacity(0.5),
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

// lib/screens/reports/reports_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/report_model.dart';
import '../../core/providers/providers.dart';
import '../../core/providers/report_provider.dart';
import '../../core/utils/format_utils.dart';
import 'widgets/widgets.dart';

/// Tela de relatórios financeiros
class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late int _selectedYear;
  late int _selectedMonth;
  List<int> _availableYears = [];

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedYear = now.year;
    _selectedMonth = now.month;
    _tabController = TabController(length: 2, vsync: this);
    _initAvailableYears();
  }

  void _initAvailableYears() {
    final currentYear = DateTime.now().year;
    _availableYears = List.generate(5, (i) => currentYear - i);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Relatórios'),
        backgroundColor: AppTheme.background,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primary,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          tabs: const [
            Tab(text: 'Mensal'),
            Tab(text: 'Anual'),
          ],
        ),
        actions: [
          // Seletor de ano
          PopupMenuButton<int>(
            onSelected: (year) {
              setState(() => _selectedYear = year);
            },
            itemBuilder: (context) => _availableYears
                .map((year) => PopupMenuItem(
                      value: year,
                      child: Text(
                        year.toString(),
                        style: TextStyle(
                          fontWeight: year == _selectedYear
                              ? FontWeight.bold
                              : FontWeight.normal,
                        ),
                      ),
                    ))
                .toList(),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Text(
                    _selectedYear.toString(),
                    style: const TextStyle(
                      color: AppTheme.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Icon(Icons.arrow_drop_down, color: AppTheme.textPrimary),
                ],
              ),
            ),
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _MonthlyReportTab(
            year: _selectedYear,
            month: _selectedMonth,
            onMonthChanged: (month) {
              setState(() => _selectedMonth = month);
            },
          ),
          _AnnualReportTab(year: _selectedYear),
        ],
      ),
    );
  }
}

/// Tab de relatório mensal
class _MonthlyReportTab extends StatelessWidget {
  final int year;
  final int month;
  final Function(int) onMonthChanged;

  const _MonthlyReportTab({
    required this.year,
    required this.month,
    required this.onMonthChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer2<TransactionProvider, AuthProvider>(
      builder: (context, transactionProvider, authProvider, _) {
        final transactions = transactionProvider.transactions;
        final userId = authProvider.user?.id ?? '';

        if (transactions.isEmpty && transactionProvider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        // Gera relatório localmente
        final reportProvider = ReportProvider();
        final report = reportProvider.generateMonthlyReport(
          userId: userId,
          year: year,
          month: month,
          transactions: transactions,
        );

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Seletor de mês
              _MonthSelector(
                year: year,
                selectedMonth: month,
                onMonthSelected: onMonthChanged,
              ),
              const SizedBox(height: 24),

              // Cards de resumo
              SummaryCards(summary: report.summary),
              const SizedBox(height: 24),

              // Gráfico de categorias
              _SectionTitle(
                title: 'Gastos por Categoria',
                icon: Icons.pie_chart,
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: CategoryPieChart(data: report.categoryBreakdown),
              ),
              const SizedBox(height: 24),

              // Lista de categorias
              _SectionTitle(
                title: 'Detalhamento',
                icon: Icons.list,
              ),
              const SizedBox(height: 16),
              _CategoryList(categories: report.categoryBreakdown),
              const SizedBox(height: 32),
            ],
          ),
        );
      },
    );
  }
}

/// Tab de relatório anual
class _AnnualReportTab extends StatelessWidget {
  final int year;

  const _AnnualReportTab({required this.year});

  @override
  Widget build(BuildContext context) {
    return Consumer2<TransactionProvider, AuthProvider>(
      builder: (context, transactionProvider, authProvider, _) {
        final transactions = transactionProvider.transactions;
        final userId = authProvider.user?.id ?? '';

        if (transactions.isEmpty && transactionProvider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        // Gera relatório anual
        final reportProvider = ReportProvider();
        final report = reportProvider.generateAnnualReport(
          userId: userId,
          year: year,
          transactions: transactions,
        );

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Relatório Anual $year',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 24),

              // Cards de resumo
              SummaryCards(summary: report.summary),
              const SizedBox(height: 24),

              // Gráfico mensal
              _SectionTitle(
                title: 'Evolução Mensal',
                icon: Icons.bar_chart,
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  children: [
                    MonthlyBarChart(data: report.monthlyData ?? []),
                    const SizedBox(height: 16),
                    _BarChartLegend(),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Gráfico de categorias
              _SectionTitle(
                title: 'Gastos por Categoria',
                icon: Icons.pie_chart,
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: CategoryPieChart(data: report.categoryBreakdown),
              ),
              const SizedBox(height: 24),

              // Lista de categorias
              _SectionTitle(
                title: 'Detalhamento Anual',
                icon: Icons.list,
              ),
              const SizedBox(height: 16),
              _CategoryList(categories: report.categoryBreakdown),
              const SizedBox(height: 32),
            ],
          ),
        );
      },
    );
  }
}

/// Seletor de mês horizontal
class _MonthSelector extends StatelessWidget {
  final int year;
  final int selectedMonth;
  final Function(int) onMonthSelected;

  const _MonthSelector({
    required this.year,
    required this.selectedMonth,
    required this.onMonthSelected,
  });

  @override
  Widget build(BuildContext context) {
    final months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    return SizedBox(
      height: 44,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: 12,
        itemBuilder: (context, index) {
          final month = index + 1;
          final isSelected = month == selectedMonth;

          return GestureDetector(
            onTap: () => onMonthSelected(month),
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? AppTheme.primary : AppTheme.card,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected ? AppTheme.primary : AppTheme.border,
                ),
              ),
              child: Center(
                child: Text(
                  months[index],
                  style: TextStyle(
                    color: isSelected ? Colors.white : AppTheme.textSecondary,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Título de seção
class _SectionTitle extends StatelessWidget {
  final String title;
  final IconData icon;

  const _SectionTitle({
    required this.title,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppTheme.primary, size: 20),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }
}

/// Lista de categorias com valores
class _CategoryList extends StatelessWidget {
  final List<CategoryData> categories;

  const _CategoryList({required this.categories});

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Center(
          child: Text(
            'Sem dados para este período',
            style: TextStyle(color: AppTheme.textSecondary),
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: categories.length,
        separatorBuilder: (_, __) => Divider(
          height: 1,
          color: AppTheme.border,
        ),
        itemBuilder: (context, index) {
          final category = categories[index];
          return ListTile(
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Text(
                  '${index + 1}º',
                  style: TextStyle(
                    color: AppTheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            title: Text(
              category.category,
              style: const TextStyle(
                color: AppTheme.textPrimary,
                fontWeight: FontWeight.w500,
              ),
            ),
            subtitle: Text(
              '${category.count} transações • ${category.percentage.toStringAsFixed(1)}%',
              style: TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 12,
              ),
            ),
            trailing: Text(
              FormatUtils.currency(category.amount),
              style: const TextStyle(
                color: AppTheme.error,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Legenda do gráfico de barras
class _BarChartLegend extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _LegendItem(color: AppTheme.success, label: 'Receitas'),
        const SizedBox(width: 24),
        _LegendItem(color: AppTheme.error, label: 'Despesas'),
      ],
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;

  const _LegendItem({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(3),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            color: AppTheme.textSecondary,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}

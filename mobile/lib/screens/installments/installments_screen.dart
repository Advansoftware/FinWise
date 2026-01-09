import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/utils/format_utils.dart';
import '../../core/providers/providers.dart';
import '../../core/widgets/compact_add_button.dart';
import 'installment_form_screen.dart';
import 'widgets/widgets.dart';

import 'overdue_installments_screen.dart';

class InstallmentsScreen extends StatefulWidget {
  const InstallmentsScreen({super.key});

  @override
  State<InstallmentsScreen> createState() => _InstallmentsScreenState();
}

class _InstallmentsScreenState extends State<InstallmentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isFirstLoad = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await context.read<InstallmentProvider>().loadInstallments();
      if (mounted) {
        setState(() => _isFirstLoad = false);
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<InstallmentProvider>();
    final summary = provider.summary;
    // final overduePayments = _getOverduePayments(provider.activeInstallments); // Removed usage

    if (_isFirstLoad && provider.isLoading) {
      return const InstallmentsSkeleton();
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Parcelamentos'),
        backgroundColor: AppTheme.background,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primary,
          labelColor: AppTheme.primary,
          unselectedLabelColor: Colors.white54,
          tabs: const [
            Tab(text: 'Ativos'),
            Tab(text: 'Concluídos'),
            Tab(text: 'Cronograma'),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => provider.loadInstallments(),
        color: AppTheme.primary,
        child: CustomScrollView(
          slivers: [
            // Summary Cards
            if (summary != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: SummaryCard(
                          title: 'Ativos',
                          value: '${summary.activeCount}',
                          icon: Icons.credit_card,
                          color: AppTheme.primary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: SummaryCard(
                          title: 'Mensal',
                          value: FormatUtils.formatCurrency(summary.monthlyTotal),
                          icon: Icons.calendar_month,
                          color: AppTheme.warning,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: SummaryCard(
                          title: 'Vencidas',
                          value: '${summary.overdueCount}',
                          icon: Icons.warning_amber,
                          color: AppTheme.error,
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const OverdueInstallmentsScreen(),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // Add Button
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: CompactAddButton(
                  label: 'Novo Parcelamento',
                  icon: Icons.add,
                  onPressed: () async {
                    final result = await InstallmentFormScreen.show(context);
                    if (result == true) {
                      provider.loadInstallments();
                    }
                  },
                ),
              ),
            ),

            // Tab Content
            SliverFillRemaining(
              child: TabBarView(
                controller: _tabController,
                children: [
                  ActiveInstallmentsTab(
                    installments: provider.activeInstallments,
                    onRefresh: () => provider.loadInstallments(),
                  ),
                  CompletedInstallmentsTab(
                    installments: provider.completedInstallments,
                  ),
                  ScheduleTab(installments: provider.activeInstallments),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }


}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/utils/format_utils.dart';
import '../../core/providers/providers.dart';
import '../../core/widgets/compact_add_button.dart';
import '../../core/widgets/skeleton_loading.dart';
import 'installment_form_screen.dart';
import 'widgets/widgets.dart';

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
    final overduePayments = _getOverduePayments(provider.activeInstallments);

    if (_isFirstLoad && provider.isLoading) {
      return const _InstallmentsSkeleton();
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
                        child: _SummaryCard(
                          title: 'Ativos',
                          value: '${summary.activeCount}',
                          icon: Icons.credit_card,
                          color: AppTheme.primary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _SummaryCard(
                          title: 'Mensal',
                          value: FormatUtils.formatCurrency(summary.monthlyTotal),
                          icon: Icons.calendar_month,
                          color: AppTheme.warning,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _SummaryCard(
                          title: 'Vencidas',
                          value: '${summary.overdueCount}',
                          icon: Icons.warning_amber,
                          color: AppTheme.error,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // Overdue Banner
            if (overduePayments.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _OverdueBanner(
                    overduePayments: overduePayments,
                    onPayPressed: () => _showOverduePaymentDialog(context, overduePayments),
                    onSchedulePressed: () => _tabController.animateTo(2),
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
                  _ActiveInstallmentsTab(
                    installments: provider.activeInstallments,
                    onRefresh: () => provider.loadInstallments(),
                  ),
                  _CompletedInstallmentsTab(
                    installments: provider.completedInstallments,
                  ),
                  _ScheduleTab(installments: provider.activeInstallments),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<_OverduePaymentInfo> _getOverduePayments(List<InstallmentModel> installments) {
    final overdueList = <_OverduePaymentInfo>[];
    for (final installment in installments) {
      for (final payment in installment.payments) {
        if (payment.isOverdue) {
          overdueList.add(_OverduePaymentInfo(
            installment: installment,
            payment: payment,
          ));
        }
      }
    }
    overdueList.sort((a, b) => a.payment.dueDate.compareTo(b.payment.dueDate));
    return overdueList;
  }

  Future<void> _showOverduePaymentDialog(BuildContext context, List<_OverduePaymentInfo> overduePayments) async {
    if (overduePayments.isEmpty) return;

    final firstOverdue = overduePayments.first;
    
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => RegisterPaymentModal(
        installment: firstOverdue.installment,
        payment: firstOverdue.payment,
        onSuccess: () {
          context.read<InstallmentProvider>().loadInstallments();
        },
      ),
    );
  }
}

class _OverduePaymentInfo {
  final InstallmentModel installment;
  final InstallmentPayment payment;

  _OverduePaymentInfo({required this.installment, required this.payment});
}

// ============================================================================
// Skeleton Loading
// ============================================================================

class _InstallmentsSkeleton extends StatelessWidget {
  const _InstallmentsSkeleton();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Parcelamentos'),
        backgroundColor: AppTheme.background,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: List.generate(3, (index) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(
                    left: index == 0 ? 0 : 4,
                    right: index == 2 ? 0 : 4,
                  ),
                  child: const SkeletonLoading(
                    width: double.infinity,
                    height: 80,
                    borderRadius: 12,
                  ),
                ),
              )),
            ),
            const SizedBox(height: 16),
            const SkeletonLoading(
              width: double.infinity,
              height: 44,
              borderRadius: 12,
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: 4,
                itemBuilder: (context, index) => const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: SkeletonLoading(
                    width: double.infinity,
                    height: 180,
                    borderRadius: 12,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================================
// Summary Card
// ============================================================================

class _SummaryCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _SummaryCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: color,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            title,
            style: TextStyle(
              fontSize: 11,
              color: Colors.white.withAlpha(153),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// Overdue Banner
// ============================================================================

class _OverdueBanner extends StatelessWidget {
  final List<_OverduePaymentInfo> overduePayments;
  final VoidCallback onPayPressed;
  final VoidCallback onSchedulePressed;

  const _OverdueBanner({
    required this.overduePayments,
    required this.onPayPressed,
    required this.onSchedulePressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.error.withAlpha(20),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.error.withAlpha(128)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(Icons.warning_amber, size: 18, color: AppTheme.error),
              const SizedBox(width: 8),
              Text(
                '${overduePayments.length} parcela(s) em atraso',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.error,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...overduePayments.take(2).map((info) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.error.withAlpha(10),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.error.withAlpha(77)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '${info.installment.name} - ${info.payment.installmentNumber}ª',
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Text(
                    FormatUtils.formatCurrency(info.payment.scheduledAmount),
                    style: TextStyle(
                      color: AppTheme.error,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          )),
          if (overduePayments.length > 2)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                '+${overduePayments.length - 2} parcela(s) em atraso',
                style: TextStyle(
                  color: AppTheme.error,
                  fontSize: 11,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onPayPressed,
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: AppTheme.error),
                    foregroundColor: AppTheme.error,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  child: const Text('Quitar', style: TextStyle(fontSize: 13)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  onPressed: onSchedulePressed,
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.white54),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  child: const Text('Cronograma', style: TextStyle(fontSize: 13)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// Active Installments Tab
// ============================================================================

class _ActiveInstallmentsTab extends StatelessWidget {
  final List<InstallmentModel> installments;
  final VoidCallback onRefresh;

  const _ActiveInstallmentsTab({
    required this.installments,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (installments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.credit_card_off_outlined,
              size: 64,
              color: Colors.white.withAlpha(77),
            ),
            const SizedBox(height: 16),
            Text(
              'Nenhum parcelamento ativo',
              style: TextStyle(
                color: Colors.white.withAlpha(128),
                fontSize: 16,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: installments.length,
      itemBuilder: (context, index) {
        return InstallmentCard(
          installment: installments[index],
          onRefresh: onRefresh,
        );
      },
    );
  }
}

// ============================================================================
// Completed Installments Tab
// ============================================================================

class _CompletedInstallmentsTab extends StatelessWidget {
  final List<InstallmentModel> installments;

  const _CompletedInstallmentsTab({required this.installments});

  @override
  Widget build(BuildContext context) {
    if (installments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.check_circle_outline,
              size: 64,
              color: Colors.white.withAlpha(77),
            ),
            const SizedBox(height: 16),
            Text(
              'Nenhum parcelamento concluído',
              style: TextStyle(
                color: Colors.white.withAlpha(128),
                fontSize: 16,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: installments.length,
      itemBuilder: (context, index) {
        return InstallmentCard(
          installment: installments[index],
          isCompleted: true,
        );
      },
    );
  }
}

// ============================================================================
// Schedule Tab
// ============================================================================

class _ScheduleTab extends StatelessWidget {
  final List<InstallmentModel> installments;

  const _ScheduleTab({required this.installments});

  @override
  Widget build(BuildContext context) {
    final allPayments = <_PaymentWithInstallment>[];
    for (final installment in installments) {
      for (final payment in installment.payments.where((p) => !p.isPaid)) {
        allPayments.add(_PaymentWithInstallment(
          installment: installment,
          payment: payment,
        ));
      }
    }
    allPayments.sort((a, b) => a.payment.dueDate.compareTo(b.payment.dueDate));

    final paymentsByMonth = <String, List<_PaymentWithInstallment>>{};
    for (final item in allPayments) {
      final monthKey = '${item.payment.dueDate.year}-${item.payment.dueDate.month.toString().padLeft(2, '0')}';
      paymentsByMonth.putIfAbsent(monthKey, () => []).add(item);
    }

    final sortedMonths = paymentsByMonth.keys.toList()..sort();

    if (sortedMonths.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.event_available,
              size: 64,
              color: Colors.white.withAlpha(77),
            ),
            const SizedBox(height: 16),
            Text(
              'Nenhum pagamento pendente',
              style: TextStyle(
                color: Colors.white.withAlpha(128),
                fontSize: 16,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: sortedMonths.length,
      itemBuilder: (context, index) {
        final monthKey = sortedMonths[index];
        final payments = paymentsByMonth[monthKey]!;
        final date = DateTime.parse('$monthKey-01');
        final monthTotal = payments.fold<double>(
          0,
          (sum, p) => sum + p.payment.scheduledAmount,
        );

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.primary.withAlpha(25),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    FormatUtils.formatMonthYear(date),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primary,
                    ),
                  ),
                  Text(
                    FormatUtils.formatCurrency(monthTotal),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            ...payments.map((p) => _PaymentScheduleItem(
              installmentName: p.installment.name,
              payment: p.payment,
            )),
            const SizedBox(height: 16),
          ],
        );
      },
    );
  }
}

class _PaymentWithInstallment {
  final InstallmentModel installment;
  final InstallmentPayment payment;

  _PaymentWithInstallment({
    required this.installment,
    required this.payment,
  });
}

class _PaymentScheduleItem extends StatelessWidget {
  final String installmentName;
  final InstallmentPayment payment;

  const _PaymentScheduleItem({
    required this.installmentName,
    required this.payment,
  });

  @override
  Widget build(BuildContext context) {
    final isOverdue = payment.isOverdue;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isOverdue ? AppTheme.error.withAlpha(128) : AppTheme.border,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: (isOverdue ? AppTheme.error : AppTheme.primary).withAlpha(25),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                '${payment.installmentNumber}',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: isOverdue ? AppTheme.error : AppTheme.primary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  installmentName,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Colors.white,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  FormatUtils.formatDateShort(payment.dueDate),
                  style: TextStyle(
                    fontSize: 11,
                    color: isOverdue ? AppTheme.error : Colors.white54,
                  ),
                ),
                if (isOverdue)
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.error.withAlpha(30),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'Em atraso',
                      style: TextStyle(
                        fontSize: 10,
                        color: AppTheme.error,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Text(
            FormatUtils.formatCurrency(payment.scheduledAmount),
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

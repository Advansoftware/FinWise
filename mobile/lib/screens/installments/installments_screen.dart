import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/utils/format_utils.dart';
import '../../core/providers/providers.dart';
import '../../core/widgets/compact_add_button.dart';
import '../../core/widgets/skeleton_loading.dart';
import 'installment_form_screen.dart';

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
                          title: 'Atraso',
                          value: '${summary.overdueCount}',
                          icon: Icons.warning_amber,
                          color: AppTheme.error,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // Alerta de Atraso
            if (overduePayments.isNotEmpty)
              SliverToBoxAdapter(
                child: _OverdueAlert(
                  overduePayments: overduePayments,
                  onPayPressed: () => _tabController.animateTo(0),
                  onSchedulePressed: () => _tabController.animateTo(2),
                ),
              ),

            // Add Button
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
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

            const SliverToBoxAdapter(child: SizedBox(height: 16)),

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
    final List<_OverduePaymentInfo> overduePayments = [];
    for (final installment in installments) {
      for (final payment in installment.payments) {
        if (payment.isOverdue) {
          overduePayments.add(_OverduePaymentInfo(
            installmentName: installment.name,
            payment: payment,
          ));
        }
      }
    }
    return overduePayments;
  }
}

class _OverduePaymentInfo {
  final String installmentName;
  final InstallmentPayment payment;

  _OverduePaymentInfo({
    required this.installmentName,
    required this.payment,
  });

  int get daysOverdue {
    return DateTime.now().difference(payment.dueDate).inDays;
  }
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
            // Summary Cards Skeleton
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
            // Button Skeleton
            const SkeletonLoading(
              width: double.infinity,
              height: 44,
              borderRadius: 12,
            ),
            const SizedBox(height: 16),
            // Cards Skeleton
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
              color: Colors.white.withAlpha(128),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// Overdue Alert
// ============================================================================

class _OverdueAlert extends StatelessWidget {
  final List<_OverduePaymentInfo> overduePayments;
  final VoidCallback onPayPressed;
  final VoidCallback onSchedulePressed;

  const _OverdueAlert({
    required this.overduePayments,
    required this.onPayPressed,
    required this.onSchedulePressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.error.withAlpha(20),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.error.withAlpha(128)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Icon(Icons.warning_amber, size: 18, color: AppTheme.error),
              const SizedBox(width: 8),
              Text(
                '${overduePayments.length} Parcela${overduePayments.length > 1 ? 's' : ''} em Atraso',
                style: TextStyle(
                  color: AppTheme.error,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Payments list (max 2)
          ...overduePayments.take(2).map((info) => Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.card,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.error.withAlpha(77)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${info.installmentName} - P${info.payment.installmentNumber}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        '${info.daysOverdue}d atraso',
                        style: TextStyle(
                          color: Colors.white.withAlpha(153),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  FormatUtils.formatCurrency(info.payment.scheduledAmount),
                  style: TextStyle(
                    color: AppTheme.error,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          )),
          // More count
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
          // Action buttons
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
        return _InstallmentCard(
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
        return _InstallmentCard(
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
    // Agrupa pagamentos por mês
    final paymentsByMonth = <String, List<_PaymentWithInstallment>>{};

    for (final installment in installments) {
      for (final payment in installment.payments.where((p) => !p.isPaid)) {
        final monthKey = '${payment.dueDate.year}-${payment.dueDate.month.toString().padLeft(2, '0')}';
        paymentsByMonth[monthKey] ??= [];
        paymentsByMonth[monthKey]!.add(_PaymentWithInstallment(
          installment: installment,
          payment: payment,
        ));
      }
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
      padding: const EdgeInsets.all(16),
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
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                Row(
                  children: [
                    Text(
                      FormatUtils.formatDateShort(payment.dueDate),
                      style: TextStyle(
                        fontSize: 11,
                        color: isOverdue ? AppTheme.error : Colors.white54,
                      ),
                    ),
                    if (isOverdue) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: AppTheme.error.withAlpha(30),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${DateTime.now().difference(payment.dueDate).inDays}d atraso',
                          style: TextStyle(
                            fontSize: 9,
                            color: AppTheme.error,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ],
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

// ============================================================================
// Installment Card (similar ao site)
// ============================================================================

class _InstallmentCard extends StatelessWidget {
  final InstallmentModel installment;
  final bool isCompleted;
  final VoidCallback? onRefresh;

  const _InstallmentCard({
    required this.installment,
    this.isCompleted = false,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final progress = installment.progress;
    final hasOverdue = installment.payments.any((p) => p.isOverdue);
    final overdueCount = installment.payments.where((p) => p.isOverdue).length;
    final nextPayment = installment.payments
        .where((p) => !p.isPaid)
        .toList()
      ..sort((a, b) => a.dueDate.compareTo(b.dueDate));
    final nextDue = nextPayment.isNotEmpty ? nextPayment.first : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasOverdue ? AppTheme.error.withAlpha(128) : AppTheme.border,
        ),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title row with status badge and menu
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        installment.name,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    _StatusBadge(
                      isCompleted: isCompleted,
                      overdueCount: overdueCount,
                      hasNextPayment: nextDue != null,
                    ),
                    if (!isCompleted)
                      _InstallmentMenu(
                        installment: installment,
                        onRefresh: onRefresh,
                      ),
                  ],
                ),
                // Description
                if (installment.description != null && installment.description!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      installment.description!,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withAlpha(153),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                const SizedBox(height: 12),

                // Progress section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Progresso',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withAlpha(153),
                      ),
                    ),
                    Text(
                      '${installment.paidInstallments}/${installment.totalInstallments} parcelas',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress,
                    backgroundColor: AppTheme.border,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      isCompleted ? AppTheme.success : AppTheme.primary,
                    ),
                    minHeight: 8,
                  ),
                ),
                const SizedBox(height: 16),

                // Values Grid
                Row(
                  children: [
                    Expanded(
                      child: _ValueItem(
                        label: 'Valor Total',
                        value: FormatUtils.formatCurrency(installment.totalAmount),
                        color: Colors.white,
                      ),
                    ),
                    Expanded(
                      child: _ValueItem(
                        label: 'Valor Parcela',
                        value: FormatUtils.formatCurrency(installment.installmentAmount),
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: _ValueItem(
                        label: 'Total Pago',
                        value: FormatUtils.formatCurrency(installment.totalPaid),
                        color: AppTheme.success,
                      ),
                    ),
                    Expanded(
                      child: _ValueItem(
                        label: 'Restante',
                        value: FormatUtils.formatCurrency(installment.remainingAmount),
                        color: AppTheme.warning,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Next Payment Section
          if (nextDue != null && !isCompleted)
            _NextPaymentSection(
              payment: nextDue,
              overdueCount: overdueCount,
              installment: installment,
              onRefresh: onRefresh,
            ),
        ],
      ),
    );
  }
}

class _ValueItem extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _ValueItem({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: Colors.white.withAlpha(128),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
      ],
    );
  }
}

// ============================================================================
// Status Badge
// ============================================================================

class _StatusBadge extends StatelessWidget {
  final bool isCompleted;
  final int overdueCount;
  final bool hasNextPayment;

  const _StatusBadge({
    required this.isCompleted,
    required this.overdueCount,
    required this.hasNextPayment,
  });

  @override
  Widget build(BuildContext context) {
    if (isCompleted) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppTheme.success.withAlpha(30),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check_circle, size: 12, color: AppTheme.success),
            const SizedBox(width: 4),
            Text(
              'Concluído',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppTheme.success,
              ),
            ),
          ],
        ),
      );
    }

    if (overdueCount > 0) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppTheme.error.withAlpha(30),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.warning, size: 12, color: AppTheme.error),
            const SizedBox(width: 4),
            Text(
              '$overdueCount Em Atraso',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppTheme.error,
              ),
            ),
          ],
        ),
      );
    }

    if (hasNextPayment) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppTheme.info.withAlpha(30),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.schedule, size: 12, color: AppTheme.info),
            const SizedBox(width: 4),
            Text(
              'Em Andamento',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppTheme.info,
              ),
            ),
          ],
        ),
      );
    }

    return const SizedBox.shrink();
  }
}

// ============================================================================
// Installment Menu
// ============================================================================

class _InstallmentMenu extends StatelessWidget {
  final InstallmentModel installment;
  final VoidCallback? onRefresh;

  const _InstallmentMenu({
    required this.installment,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final nextPayment = installment.payments
        .where((p) => !p.isPaid)
        .toList()
      ..sort((a, b) => a.dueDate.compareTo(b.dueDate));
    final hasNextPayment = nextPayment.isNotEmpty;

    return PopupMenuButton<String>(
      icon: Icon(Icons.more_vert, size: 20, color: Colors.white.withAlpha(179)),
      color: AppTheme.card,
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      itemBuilder: (context) => [
        if (hasNextPayment)
          PopupMenuItem(
            value: 'pay',
            child: Row(
              children: [
                Icon(Icons.attach_money, size: 18, color: AppTheme.success),
                const SizedBox(width: 8),
                const Text('Registrar Pagamento', style: TextStyle(color: Colors.white)),
              ],
            ),
          ),
        PopupMenuItem(
          value: 'edit',
          child: Row(
            children: [
              Icon(Icons.edit, size: 18, color: Colors.white.withAlpha(179)),
              const SizedBox(width: 8),
              const Text('Editar', style: TextStyle(color: Colors.white)),
            ],
          ),
        ),
        PopupMenuItem(
          value: 'delete',
          child: Row(
            children: [
              Icon(Icons.delete, size: 18, color: AppTheme.error),
              const SizedBox(width: 8),
              Text('Excluir', style: TextStyle(color: AppTheme.error)),
            ],
          ),
        ),
      ],
      onSelected: (value) => _handleMenuAction(context, value),
    );
  }

  void _handleMenuAction(BuildContext context, String action) async {
    switch (action) {
      case 'pay':
        await _showPaymentDialog(context);
        break;
      case 'edit':
        final result = await InstallmentFormScreen.show(
          context,
          installment: installment,
        );
        if (result == true && onRefresh != null) {
          onRefresh!();
        }
        break;
      case 'delete':
        _showDeleteDialog(context);
        break;
    }
  }

  Future<void> _showPaymentDialog(BuildContext context) async {
    final nextPayment = installment.payments
        .where((p) => !p.isPaid)
        .toList()
      ..sort((a, b) => a.dueDate.compareTo(b.dueDate));
    
    if (nextPayment.isEmpty) return;
    
    final payment = nextPayment.first;
    
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Registrar Pagamento', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Marcar a parcela ${payment.installmentNumber} como paga?',
              style: TextStyle(color: Colors.white.withAlpha(204)),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.background,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Parcela ${payment.installmentNumber}',
                    style: const TextStyle(color: Colors.white),
                  ),
                  Text(
                    FormatUtils.formatCurrency(payment.scheduledAmount),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancelar', style: TextStyle(color: Colors.white.withAlpha(153))),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: AppTheme.success),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      try {
        await context.read<InstallmentProvider>().markAsPaid(
          installment.id,
          payment.installmentNumber,
        );
        if (onRefresh != null) {
          onRefresh!();
        }
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Parcela ${payment.installmentNumber} paga com sucesso!'),
              backgroundColor: AppTheme.success,
            ),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Erro ao registrar pagamento: $e'),
              backgroundColor: AppTheme.error,
            ),
          );
        }
      }
    }
  }

  void _showDeleteDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Excluir Parcelamento', style: TextStyle(color: Colors.white)),
        content: Text(
          'Tem certeza que deseja excluir "${installment.name}"? Esta ação não pode ser desfeita.',
          style: TextStyle(color: Colors.white.withAlpha(204)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancelar', style: TextStyle(color: Colors.white.withAlpha(153))),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await context.read<InstallmentProvider>().deleteInstallment(installment.id);
                if (onRefresh != null) {
                  onRefresh!();
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Erro ao excluir: $e'),
                      backgroundColor: AppTheme.error,
                    ),
                  );
                }
              }
            },
            style: FilledButton.styleFrom(backgroundColor: AppTheme.error),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// Next Payment Section
// ============================================================================

class _NextPaymentSection extends StatelessWidget {
  final InstallmentPayment payment;
  final int overdueCount;
  final InstallmentModel? installment;
  final VoidCallback? onRefresh;

  const _NextPaymentSection({
    required this.payment,
    required this.overdueCount,
    this.installment,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final isOverdue = payment.isOverdue;
    final daysOverdue = isOverdue 
        ? DateTime.now().difference(payment.dueDate).inDays 
        : 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isOverdue ? AppTheme.error.withAlpha(15) : Colors.transparent,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(12),
          bottomRight: Radius.circular(12),
        ),
        border: Border(
          top: BorderSide(color: AppTheme.border),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Overdue warning
          if (isOverdue)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.error.withAlpha(25),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.error.withAlpha(77)),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning, size: 16, color: AppTheme.error),
                  const SizedBox(width: 8),
                  Text(
                    'Parcela em atraso!',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.error,
                    ),
                  ),
                ],
              ),
            ),

          // Payment info
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isOverdue ? 'Venceu em' : 'Próximo Vencimento',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.white.withAlpha(128),
                    ),
                  ),
                  Text(
                    FormatUtils.formatDateShort(payment.dueDate),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  if (isOverdue)
                    Text(
                      '$daysOverdue dias de atraso',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.white.withAlpha(128),
                      ),
                    ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'Parcela ${payment.installmentNumber}',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.white.withAlpha(128),
                    ),
                  ),
                  Text(
                    FormatUtils.formatCurrency(payment.scheduledAmount),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Action buttons (like web version)
          const SizedBox(height: 16),
          
          // Registrar button (orange/warning color)
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => _handleRegisterPayment(context),
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.warning,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              icon: const Icon(Icons.attach_money, size: 18),
              label: const Text('Registrar', style: TextStyle(fontWeight: FontWeight.w600)),
            ),
          ),
          
          const SizedBox(height: 8),
          
          // Marcar como Pago button (outline)
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _handleMarkAsPaid(context),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Colors.white38),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              icon: const Icon(Icons.check_circle_outline, size: 18),
              label: const Text('Marcar como Pago', style: TextStyle(fontWeight: FontWeight.w500)),
            ),
          ),

          // Multiple overdue warning
          if (overdueCount > 1)
            Container(
              margin: const EdgeInsets.only(top: 12),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.warning.withAlpha(25),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.warning.withAlpha(51)),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning_amber, size: 16, color: AppTheme.warning),
                  const SizedBox(width: 8),
                  Text(
                    'Você tem $overdueCount parcelas em atraso',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.warning,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _handleRegisterPayment(BuildContext context) async {
    if (installment == null) return;
    
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Registrar Pagamento', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Registre o pagamento da parcela ${payment.installmentNumber} de ${installment!.name}',
              style: TextStyle(color: Colors.white.withAlpha(204)),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.background,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Valor Previsto', style: TextStyle(color: Colors.white70)),
                  Text(
                    FormatUtils.formatCurrency(payment.scheduledAmount),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancelar', style: TextStyle(color: Colors.white.withAlpha(153))),
          ),
          FilledButton.icon(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: AppTheme.warning),
            icon: const Icon(Icons.attach_money, size: 18),
            label: const Text('Registrar Pagamento'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      try {
        await context.read<InstallmentProvider>().markAsPaid(
          installment!.id,
          payment.installmentNumber,
        );
        if (onRefresh != null) {
          onRefresh!();
        }
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Parcela ${payment.installmentNumber} paga com sucesso!'),
              backgroundColor: AppTheme.success,
            ),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Erro ao registrar pagamento: $e'),
              backgroundColor: AppTheme.error,
            ),
          );
        }
      }
    }
  }

  void _handleMarkAsPaid(BuildContext context) async {
    if (installment == null) return;
    
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Marcar como Pago', style: TextStyle(color: Colors.white)),
        content: Text(
          'Marcar a parcela ${payment.installmentNumber} como paga?',
          style: TextStyle(color: Colors.white.withAlpha(204)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancelar', style: TextStyle(color: Colors.white.withAlpha(153))),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: AppTheme.success),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      try {
        await context.read<InstallmentProvider>().markAsPaid(
          installment!.id,
          payment.installmentNumber,
        );
        if (onRefresh != null) {
          onRefresh!();
        }
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Parcela ${payment.installmentNumber} marcada como paga!'),
              backgroundColor: AppTheme.success,
            ),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Erro: $e'),
              backgroundColor: AppTheme.error,
            ),
          );
        }
      }
    }
  }
}

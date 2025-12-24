import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/utils/format_utils.dart';
import '../../core/providers/providers.dart';
import 'installment_form_screen.dart';

class InstallmentsScreen extends StatefulWidget {
  const InstallmentsScreen({super.key});

  @override
  State<InstallmentsScreen> createState() => _InstallmentsScreenState();
}

class _InstallmentsScreenState extends State<InstallmentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InstallmentProvider>().loadInstallments();
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
      body: Column(
        children: [
          // Summary Cards
          if (summary != null)
            Padding(
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
          // Botão de adicionar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _AddInstallmentButton(
              onPressed: () async {
                final result = await InstallmentFormScreen.show(context);
                if (result == true) {
                  provider.loadInstallments();
                }
              },
            ),
          ),
          const SizedBox(height: 16),
          // Tab Views
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _ActiveInstallmentsTab(installments: provider.activeInstallments),
                _CompletedInstallmentsTab(installments: provider.completedInstallments),
                _ScheduleTab(installments: provider.activeInstallments),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

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
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
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

class _AddInstallmentButton extends StatelessWidget {
  final VoidCallback onPressed;

  const _AddInstallmentButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppTheme.primary,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.add, color: Colors.white, size: 20),
              SizedBox(width: 8),
              Text(
                'Novo Parcelamento',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActiveInstallmentsTab extends StatelessWidget {
  final List<InstallmentModel> installments;

  const _ActiveInstallmentsTab({required this.installments});

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
        return _InstallmentCard(installment: installments[index]);
      },
    );
  }
}

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
                Text(
                  FormatUtils.formatDateShort(payment.dueDate),
                  style: TextStyle(
                    fontSize: 11,
                    color: isOverdue ? AppTheme.error : Colors.white54,
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

class _InstallmentCard extends StatelessWidget {
  final InstallmentModel installment;
  final bool isCompleted;

  const _InstallmentCard({
    required this.installment,
    this.isCompleted = false,
  });

  @override
  Widget build(BuildContext context) {
    final progress = installment.progress;
    final hasOverdue = installment.payments.any((p) => p.isOverdue);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasOverdue ? AppTheme.error.withAlpha(128) : AppTheme.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: (isCompleted ? AppTheme.success : AppTheme.primary)
                      .withAlpha(25),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  isCompleted ? Icons.check_circle : Icons.credit_card,
                  color: isCompleted ? AppTheme.success : AppTheme.primary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      installment.name,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      '${installment.category}${installment.establishment != null ? ' • ${installment.establishment}' : ''}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withAlpha(128),
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    FormatUtils.formatCurrency(installment.installmentAmount),
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    '/mês',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.white.withAlpha(102),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: AppTheme.border,
              valueColor: AlwaysStoppedAnimation<Color>(
                isCompleted ? AppTheme.success : AppTheme.primary,
              ),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${installment.paidInstallments}/${installment.totalInstallments} parcelas',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withAlpha(153),
                ),
              ),
              Text(
                '${(progress * 100).toInt()}%',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isCompleted ? AppTheme.success : AppTheme.primary,
                ),
              ),
            ],
          ),
          if (!isCompleted && installment.nextDueDate != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: (hasOverdue ? AppTheme.error : AppTheme.warning)
                    .withAlpha(25),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    hasOverdue ? Icons.warning : Icons.schedule,
                    size: 14,
                    color: hasOverdue ? AppTheme.error : AppTheme.warning,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    hasOverdue
                        ? 'Parcela em atraso'
                        : 'Próxima: ${FormatUtils.formatDateShort(installment.nextDueDate!)}',
                    style: TextStyle(
                      fontSize: 11,
                      color: hasOverdue ? AppTheme.error : AppTheme.warning,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

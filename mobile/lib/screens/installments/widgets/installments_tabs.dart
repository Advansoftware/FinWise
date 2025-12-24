import 'package:flutter/material.dart';
import '../../../../core/models/models.dart';
import 'installment_card.dart';

class ActiveInstallmentsTab extends StatelessWidget {
  final List<InstallmentModel> installments;
  final VoidCallback onRefresh;

  const ActiveInstallmentsTab({
    super.key,
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

class CompletedInstallmentsTab extends StatelessWidget {
  final List<InstallmentModel> installments;

  const CompletedInstallmentsTab({super.key, required this.installments});

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

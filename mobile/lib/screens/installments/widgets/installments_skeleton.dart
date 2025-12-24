import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/skeleton_loading.dart';

class InstallmentsSkeleton extends StatelessWidget {
  const InstallmentsSkeleton({super.key});

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

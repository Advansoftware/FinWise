import 'package:flutter/material.dart';

/// Widget de Skeleton loading para carregamento inicial
class SkeletonLoading extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const SkeletonLoading({
    super.key,
    this.width = double.infinity,
    this.height = 20,
    this.borderRadius = 8,
  });

  @override
  State<SkeletonLoading> createState() => _SkeletonLoadingState();
}

class _SkeletonLoadingState extends State<SkeletonLoading>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
    _animation = Tween<double>(begin: -2, end: 2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment(_animation.value - 1, 0),
              end: Alignment(_animation.value + 1, 0),
              colors: [
                Colors.white.withOpacity(0.05),
                Colors.white.withOpacity(0.1),
                Colors.white.withOpacity(0.05),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Card de Skeleton para transações
class SkeletonTransactionCard extends StatelessWidget {
  const SkeletonTransactionCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const SkeletonLoading(width: 48, height: 48, borderRadius: 12),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonLoading(width: 120, height: 16, borderRadius: 4),
                const SizedBox(height: 8),
                SkeletonLoading(width: 80, height: 12, borderRadius: 4),
              ],
            ),
          ),
          const SkeletonLoading(width: 70, height: 16, borderRadius: 4),
        ],
      ),
    );
  }
}

/// Card de Skeleton para carteiras
class SkeletonWalletCard extends StatelessWidget {
  const SkeletonWalletCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const SkeletonLoading(width: 48, height: 48, borderRadius: 12),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonLoading(width: 100, height: 16, borderRadius: 4),
                const SizedBox(height: 8),
                SkeletonLoading(width: 60, height: 12, borderRadius: 4),
              ],
            ),
          ),
          const SkeletonLoading(width: 80, height: 20, borderRadius: 4),
        ],
      ),
    );
  }
}

/// Skeleton para stats cards
class SkeletonStatsCard extends StatelessWidget {
  const SkeletonStatsCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const SkeletonLoading(width: 32, height: 32, borderRadius: 8),
              const SizedBox(width: 12),
              SkeletonLoading(width: 80, height: 14, borderRadius: 4),
            ],
          ),
          const SizedBox(height: 12),
          SkeletonLoading(width: 100, height: 24, borderRadius: 4),
        ],
      ),
    );
  }
}

/// Skeleton para dashboard completo
class SkeletonDashboard extends StatelessWidget {
  const SkeletonDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header skeleton
          Row(
            children: [
              const SkeletonLoading(width: 48, height: 48, borderRadius: 24),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SkeletonLoading(width: 120, height: 18, borderRadius: 4),
                  const SizedBox(height: 6),
                  SkeletonLoading(width: 80, height: 12, borderRadius: 4),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          // Add button skeleton
          SkeletonLoading(width: double.infinity, height: 44, borderRadius: 12),
          const SizedBox(height: 16),
          // Stats cards skeleton
          Row(
            children: const [
              Expanded(child: SkeletonStatsCard()),
              SizedBox(width: 12),
              Expanded(child: SkeletonStatsCard()),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: const [
              Expanded(child: SkeletonStatsCard()),
              SizedBox(width: 12),
              Expanded(child: SkeletonStatsCard()),
            ],
          ),
          const SizedBox(height: 24),
          // Transactions skeleton
          SkeletonLoading(width: 150, height: 18, borderRadius: 4),
          const SizedBox(height: 16),
          const SkeletonTransactionCard(),
          const SkeletonTransactionCard(),
          const SkeletonTransactionCard(),
        ],
      ),
    );
  }
}

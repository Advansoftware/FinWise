import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/utils/format_utils.dart';
import '../../core/providers/providers.dart';
import '../../core/widgets/compact_add_button.dart';
import '../../core/widgets/skeleton_loading.dart';
import 'wallet_form_screen.dart';

class WalletsScreen extends StatelessWidget {
  const WalletsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final walletProvider = context.watch<WalletProvider>();
    final wallets = walletProvider.wallets;
    final isLoading = walletProvider.isLoading;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Carteiras'),
        backgroundColor: AppTheme.background,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: CompactAddButton(
              onPressed: () async {
                final result = await WalletFormScreen.show(context);
                if (result == true) {
                  walletProvider.loadWallets();
                }
              },
              label: 'Nova',
              icon: Icons.add,
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => walletProvider.loadWallets(),
        color: AppTheme.primary,
        child: isLoading && wallets.isEmpty
            ? ListView(
                padding: const EdgeInsets.all(16),
                children: const [
                  SkeletonLoading(width: double.infinity, height: 120, borderRadius: 20),
                  SizedBox(height: 24),
                  SkeletonLoading(width: 120, height: 18, borderRadius: 4),
                  SizedBox(height: 12),
                  SkeletonWalletCard(),
                  SkeletonWalletCard(),
                  SkeletonWalletCard(),
                ],
              )
            : wallets.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.account_balance_wallet_outlined,
                          size: 64,
                          color: Colors.white.withOpacity(0.3),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Nenhuma carteira encontrada',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.5),
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 16),
                        CompactAddButton(
                          onPressed: () async {
                            final result = await WalletFormScreen.show(context);
                            if (result == true) {
                              walletProvider.loadWallets();
                            }
                          },
                          label: 'Criar Carteira',
                          icon: Icons.add,
                        ),
                      ],
                    ),
                  )
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Total card
                      _TotalBalanceCard(
                        totalBalance: walletProvider.totalBalance,
                      ),
                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Suas Carteiras',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.white.withOpacity(0.9),
                            ),
                          ),
                          Text(
                            '${wallets.length} ${wallets.length == 1 ? 'carteira' : 'carteiras'}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.white.withOpacity(0.5),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      ...wallets.map((w) => _WalletCard(
                        wallet: w,
                        onTap: () async {
                          final result = await WalletFormScreen.show(context, wallet: w);
                          if (result == true) {
                            walletProvider.loadWallets();
                          }
                        },
                      )),
                    ],
                  ),
      ),
    );
  }
}

class _TotalBalanceCard extends StatelessWidget {
  final double totalBalance;

  const _TotalBalanceCard({required this.totalBalance});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.primary,
            Color(0xFF7C3AED),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Patrimônio Total',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withOpacity(0.8),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            FormatUtils.formatCurrency(totalBalance),
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

class _WalletCard extends StatelessWidget {
  final WalletModel wallet;
  final VoidCallback? onTap;

  const _WalletCard({required this.wallet, this.onTap});

  IconData _getWalletIcon() {
    switch (wallet.type) {
      case WalletType.cash:
        return Icons.payments;
      case WalletType.checking:
        return Icons.account_balance;
      case WalletType.savings:
        return Icons.savings;
      case WalletType.creditCard:
        return Icons.credit_card;
      case WalletType.investment:
        return Icons.trending_up;
      default:
        return Icons.account_balance_wallet;
    }
  }

  String _getWalletTypeName() {
    switch (wallet.type) {
      case WalletType.cash:
        return 'Dinheiro';
      case WalletType.checking:
        return 'Conta Corrente';
      case WalletType.savings:
        return 'Poupança';
      case WalletType.creditCard:
        return 'Cartão de Crédito';
      case WalletType.investment:
        return 'Investimento';
      default:
        return 'Outros';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isPositive = wallet.balance >= 0;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.border),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  _getWalletIcon(),
                  size: 24,
                  color: AppTheme.primary,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      wallet.name,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _getWalletTypeName(),
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withOpacity(0.5),
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                FormatUtils.formatCurrency(wallet.balance),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isPositive ? AppTheme.success : AppTheme.error,
                ),
              ),
              const SizedBox(width: 8),
              Icon(
                Icons.chevron_right,
                color: Colors.white.withOpacity(0.3),
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

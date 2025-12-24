import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/format_utils.dart';
import '../../../core/providers/providers.dart';

/// Modal para registrar pagamento de parcela (igual versão web)
class RegisterPaymentModal extends StatefulWidget {
  final InstallmentModel installment;
  final InstallmentPayment payment;
  final VoidCallback onSuccess;

  const RegisterPaymentModal({
    super.key,
    required this.installment,
    required this.payment,
    required this.onSuccess,
  });

  @override
  State<RegisterPaymentModal> createState() => _RegisterPaymentModalState();
}

class _RegisterPaymentModalState extends State<RegisterPaymentModal> {
  final TextEditingController _valueController = TextEditingController();
  String? _selectedWalletId;
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    _valueController.text = widget.payment.scheduledAmount.toStringAsFixed(2).replaceAll('.', ',');
  }

  @override
  void dispose() {
    _valueController.dispose();
    super.dispose();
  }

  double get _paidValue {
    final text = _valueController.text.replaceAll(',', '.').replaceAll('R\$', '').trim();
    return double.tryParse(text) ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    final wallets = context.watch<WalletProvider>().wallets;
    final selectedWallet = wallets.where((w) => w.id == _selectedWalletId).firstOrNull;
    final hasInsufficientBalance = selectedWallet != null && selectedWallet.balance < _paidValue;

    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: const BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Registrar Pagamento',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Registre o pagamento da parcela ${widget.payment.installmentNumber} de ${widget.installment.name}',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.white.withAlpha(153),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              
              const SizedBox(height: 20),
              
              // Payment Info Card
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.background,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  children: [
                    _buildInfoRow('Parcela', '${widget.payment.installmentNumber}/${widget.installment.totalInstallments}'),
                    const SizedBox(height: 8),
                    _buildInfoRow('Vencimento', FormatUtils.formatDateShort(widget.payment.dueDate)),
                    const SizedBox(height: 8),
                    _buildInfoRow('Valor Previsto', FormatUtils.formatCurrency(widget.payment.scheduledAmount)),
                  ],
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Wallet selector
              Text(
                'Carteira para Débito',
                style: TextStyle(fontSize: 13, color: Colors.white.withAlpha(179)),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: AppTheme.background,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.border),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedWalletId,
                    isExpanded: true,
                    dropdownColor: AppTheme.card,
                    hint: Text('Selecione uma carteira', style: TextStyle(color: Colors.white.withAlpha(128))),
                    items: wallets.map((wallet) => DropdownMenuItem(
                      value: wallet.id,
                      child: Row(
                        children: [
                          Icon(Icons.account_balance_wallet, size: 18, color: AppTheme.primary),
                          const SizedBox(width: 8),
                          Expanded(child: Text(wallet.name, style: const TextStyle(color: Colors.white))),
                        ],
                      ),
                    )).toList(),
                    onChanged: (value) => setState(() => _selectedWalletId = value),
                  ),
                ),
              ),
              
              // Balance info
              if (selectedWallet != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withAlpha(25),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.account_balance_wallet, size: 16, color: AppTheme.primary),
                      const SizedBox(width: 8),
                      Text(
                        'Saldo disponível: ${FormatUtils.formatCurrency(selectedWallet.balance)}',
                        style: TextStyle(color: AppTheme.primary, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ],
              
              const SizedBox(height: 16),
              
              // Value input
              Text(
                'Valor Pago',
                style: TextStyle(fontSize: 13, color: Colors.white.withAlpha(179)),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _valueController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                style: const TextStyle(color: Colors.white, fontSize: 16),
                decoration: InputDecoration(
                  prefixText: 'R\$ ',
                  prefixStyle: const TextStyle(color: Colors.white70),
                  filled: true,
                  fillColor: AppTheme.background,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: AppTheme.border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: AppTheme.border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: AppTheme.primary),
                  ),
                ),
                onChanged: (_) => setState(() {}),
              ),
              
              // Insufficient balance warning
              if (hasInsufficientBalance) ...[
                const SizedBox(height: 12),
                Container(
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
                      const Expanded(
                        child: Text(
                          'Saldo insuficiente na carteira selecionada',
                          style: TextStyle(color: Colors.white, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              
              const SizedBox(height: 24),
              
              // Action buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white38),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Cancelar'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: FilledButton.icon(
                      onPressed: (_selectedWalletId == null || hasInsufficientBalance || _isLoading)
                          ? null
                          : _handleSubmit,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppTheme.error,
                        disabledBackgroundColor: AppTheme.error.withAlpha(77),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      icon: _isLoading 
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.attach_money, size: 18),
                      label: Text(_isLoading ? 'Registrando...' : 'Registrar Pagamento'),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: Colors.white.withAlpha(153), fontSize: 13)),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
      ],
    );
  }

  Future<void> _handleSubmit() async {
    setState(() => _isLoading = true);
    
    try {
      await context.read<InstallmentProvider>().markAsPaid(
        widget.installment.id,
        widget.payment.installmentNumber,
      );
      
      widget.onSuccess();
      
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Parcela ${widget.payment.installmentNumber} paga com sucesso!'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao registrar pagamento: $e'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
}

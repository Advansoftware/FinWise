// lib/screens/transactions/transaction_form_screen.dart
// Modal fullscreen para adicionar/editar transações

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/providers/providers.dart';

class TransactionFormScreen extends StatefulWidget {
  final TransactionModel? transaction; // null = criar nova

  const TransactionFormScreen({super.key, this.transaction});

  /// Abre o modal fullscreen
  static Future<bool?> show(BuildContext context, {TransactionModel? transaction}) {
    return Navigator.of(context).push<bool>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (context) => TransactionFormScreen(transaction: transaction),
      ),
    );
  }

  @override
  State<TransactionFormScreen> createState() => _TransactionFormScreenState();
}

class _TransactionFormScreenState extends State<TransactionFormScreen> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _descriptionController;
  late TextEditingController _amountController;
  
  TransactionType _type = TransactionType.expense;
  String _category = 'Outros';
  String? _selectedWalletId;
  DateTime _selectedDate = DateTime.now();
  bool _isLoading = false;

  bool get isEditing => widget.transaction != null;

  // Categorias padrão
  final List<String> _expenseCategories = [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Lazer',
    'Saúde',
    'Educação',
    'Compras',
    'Serviços',
    'Investimentos',
    'Outros',
  ];

  final List<String> _incomeCategories = [
    'Salário',
    'Freelance',
    'Investimentos',
    'Presente',
    'Vendas',
    'Outros',
  ];

  @override
  void initState() {
    super.initState();
    
    final tx = widget.transaction;
    _descriptionController = TextEditingController(text: tx?.description ?? '');
    _amountController = TextEditingController(
      text: tx != null ? tx.amount.toStringAsFixed(2).replaceAll('.', ',') : '',
    );
    
    if (tx != null) {
      _type = tx.type;
      _category = tx.category ?? 'Outros';
      _selectedWalletId = tx.walletId;
      _selectedDate = tx.date;
    }
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  List<String> get _categories => 
      _type == TransactionType.expense ? _expenseCategories : _incomeCategories;

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppTheme.primary,
              onPrimary: Colors.white,
              surface: AppTheme.card,
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedWalletId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecione uma carteira')),
      );
      return;
    }

    setState(() => _isLoading = true);

    final amountText = _amountController.text
        .replaceAll('.', '')
        .replaceAll(',', '.');
    final amount = double.tryParse(amountText) ?? 0;

    final transaction = TransactionModel(
      id: widget.transaction?.id ?? '',
      description: _descriptionController.text.trim(),
      amount: amount,
      type: _type,
      category: _category,
      walletId: _selectedWalletId!,
      date: _selectedDate,
      createdAt: widget.transaction?.createdAt ?? DateTime.now(),
    );

    final provider = context.read<TransactionProvider>();
    bool success;

    if (isEditing) {
      success = await provider.updateTransaction(widget.transaction!.id, transaction);
    } else {
      success = await provider.addTransaction(transaction);
    }

    setState(() => _isLoading = false);

    if (success && mounted) {
      // Atualiza saldo das carteiras
      await context.read<WalletProvider>().loadWallets();
      Navigator.of(context).pop(true);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.error ?? 'Erro ao salvar transação')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final wallets = context.watch<WalletProvider>().wallets;
    
    // Seleciona primeira carteira se não houver seleção
    if (_selectedWalletId == null && wallets.isNotEmpty) {
      _selectedWalletId = wallets.first.id;
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: AppTheme.background,
        elevation: 0,
        title: Text(isEditing ? 'Editar Transação' : 'Nova Transação'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _save,
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text(
                    'Salvar',
                    style: TextStyle(
                      color: AppTheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Tipo de transação
            _buildSectionTitle('Tipo'),
            const SizedBox(height: 8),
            _buildTypeSelector(),
            const SizedBox(height: 24),

            // Valor
            _buildSectionTitle('Valor'),
            const SizedBox(height: 8),
            _buildAmountField(),
            const SizedBox(height: 24),

            // Descrição
            _buildSectionTitle('Descrição'),
            const SizedBox(height: 8),
            _buildDescriptionField(),
            const SizedBox(height: 24),

            // Categoria
            _buildSectionTitle('Categoria'),
            const SizedBox(height: 8),
            _buildCategorySelector(),
            const SizedBox(height: 24),

            // Carteira
            _buildSectionTitle('Carteira'),
            const SizedBox(height: 8),
            _buildWalletSelector(wallets),
            const SizedBox(height: 24),

            // Data
            _buildSectionTitle('Data'),
            const SizedBox(height: 8),
            _buildDateSelector(),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: Colors.white.withAlpha(179),
      ),
    );
  }

  Widget _buildTypeSelector() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: _TypeButton(
              label: 'Despesa',
              icon: Icons.arrow_downward,
              color: AppTheme.error,
              isSelected: _type == TransactionType.expense,
              onTap: () => setState(() {
                _type = TransactionType.expense;
                if (!_expenseCategories.contains(_category)) {
                  _category = 'Outros';
                }
              }),
            ),
          ),
          Expanded(
            child: _TypeButton(
              label: 'Receita',
              icon: Icons.arrow_upward,
              color: AppTheme.success,
              isSelected: _type == TransactionType.income,
              onTap: () => setState(() {
                _type = TransactionType.income;
                if (!_incomeCategories.contains(_category)) {
                  _category = 'Outros';
                }
              }),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAmountField() {
    return TextFormField(
      controller: _amountController,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      style: TextStyle(
        fontSize: 32,
        fontWeight: FontWeight.bold,
        color: _type == TransactionType.expense ? AppTheme.error : AppTheme.success,
      ),
      textAlign: TextAlign.center,
      decoration: InputDecoration(
        prefixText: 'R\$ ',
        prefixStyle: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: _type == TransactionType.expense ? AppTheme.error : AppTheme.success,
        ),
        hintText: '0,00',
        hintStyle: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: Colors.white.withAlpha(77),
        ),
        filled: true,
        fillColor: AppTheme.card,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.primary, width: 2),
        ),
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Informe o valor';
        }
        final amount = double.tryParse(
          value.replaceAll('.', '').replaceAll(',', '.'),
        );
        if (amount == null || amount <= 0) {
          return 'Valor inválido';
        }
        return null;
      },
    );
  }

  Widget _buildDescriptionField() {
    return TextFormField(
      controller: _descriptionController,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: 'Ex: Almoço no restaurante',
        hintStyle: TextStyle(color: Colors.white.withAlpha(77)),
        filled: true,
        fillColor: AppTheme.card,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.primary, width: 2),
        ),
      ),
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          return 'Informe uma descrição';
        }
        return null;
      },
    );
  }

  Widget _buildCategorySelector() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _categories.map((category) {
        final isSelected = _category == category;
        return GestureDetector(
          onTap: () => setState(() => _category = category),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: isSelected ? AppTheme.primary : AppTheme.card,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected ? AppTheme.primary : AppTheme.border,
              ),
            ),
            child: Text(
              category,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected ? Colors.white : Colors.white.withAlpha(179),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildWalletSelector(List<WalletModel> wallets) {
    if (wallets.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Text(
          'Nenhuma carteira encontrada',
          style: TextStyle(color: Colors.white.withAlpha(128)),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedWalletId,
          isExpanded: true,
          dropdownColor: AppTheme.card,
          style: const TextStyle(color: Colors.white),
          icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white54),
          items: wallets.map((wallet) {
            return DropdownMenuItem(
              value: wallet.id,
              child: Row(
                children: [
                  Icon(
                    _getWalletIcon(wallet.type),
                    size: 20,
                    color: AppTheme.primary,
                  ),
                  const SizedBox(width: 12),
                  Text(wallet.name),
                ],
              ),
            );
          }).toList(),
          onChanged: (value) => setState(() => _selectedWalletId = value),
        ),
      ),
    );
  }

  IconData _getWalletIcon(WalletType type) {
    switch (type) {
      case WalletType.cash:
        return Icons.money;
      case WalletType.checking:
        return Icons.account_balance;
      case WalletType.savings:
        return Icons.savings;
      case WalletType.creditCard:
        return Icons.credit_card;
      case WalletType.investment:
        return Icons.trending_up;
      case WalletType.other:
        return Icons.account_balance_wallet;
    }
  }

  Widget _buildDateSelector() {
    return GestureDetector(
      onTap: _selectDate,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            const Icon(Icons.calendar_today, size: 20, color: AppTheme.primary),
            const SizedBox(width: 12),
            Text(
              _formatDate(_selectedDate),
              style: const TextStyle(color: Colors.white, fontSize: 15),
            ),
            const Spacer(),
            const Icon(Icons.keyboard_arrow_down, color: Colors.white54),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return '${date.day} de ${months[date.month - 1]} de ${date.year}';
  }
}

class _TypeButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final bool isSelected;
  final VoidCallback onTap;

  const _TypeButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isSelected ? color.withAlpha(51) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 20,
              color: isSelected ? color : Colors.white54,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected ? color : Colors.white54,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

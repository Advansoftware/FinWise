import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/transaction_model.dart';

class TransactionsFilterSheet extends StatefulWidget {
  const TransactionsFilterSheet({super.key});

  @override
  State<TransactionsFilterSheet> createState() => _TransactionsFilterSheetState();
}

class _TransactionsFilterSheetState extends State<TransactionsFilterSheet> {
  String? _selectedWalletId;
  String? _selectedCategory;
  TransactionType? _selectedType;

  // Categorias baseadas no app
  final List<String> _categories = [
    'Alimentação',
    'Supermercado',
    'Transporte',
    'Lazer',
    'Saúde',
    'Educação',
    'Moradia',
    'Investimentos',
    'Outros',
  ];

  @override
  void initState() {
    super.initState();
    final provider = context.read<TransactionProvider>();
    _selectedWalletId = provider.filterWalletId;
    _selectedCategory = provider.filterCategory;
    _selectedType = provider.filterType;
  }

  void _applyFilters() {
    context.read<TransactionProvider>().setFilters(
      walletId: _selectedWalletId,
      category: _selectedCategory,
      type: _selectedType,
    );
    Navigator.pop(context);
  }

  void _clearFilters() {
    context.read<TransactionProvider>().clearFilters();
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final wallets = context.watch<WalletProvider>().wallets;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Filtrar Transações',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close, color: Colors.white54),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Tipo de Transação
          const Text(
            'Tipo',
            style: TextStyle(fontSize: 14, color: Colors.white54, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip(
                  label: 'Todos',
                  isSelected: _selectedType == null,
                  onTap: () => setState(() => _selectedType = null),
                ),
                const SizedBox(width: 8),
                _buildFilterChip(
                  label: 'Receitas',
                  isSelected: _selectedType == TransactionType.income,
                  onTap: () => setState(() => _selectedType = TransactionType.income),
                  color: AppTheme.success,
                ),
                const SizedBox(width: 8),
                _buildFilterChip(
                  label: 'Despesas',
                  isSelected: _selectedType == TransactionType.expense,
                  onTap: () => setState(() => _selectedType = TransactionType.expense),
                  color: AppTheme.error,
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Carteira
          const Text(
            'Carteira',
            style: TextStyle(fontSize: 14, color: Colors.white54, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: wallets.any((w) => w.id == _selectedWalletId) ? _selectedWalletId : null,
            dropdownColor: AppTheme.card,
            decoration: InputDecoration(
              filled: true,
              fillColor: AppTheme.background,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
            hint: const Text('Todas as carteiras', style: TextStyle(color: Colors.white54)),
            style: const TextStyle(color: Colors.white),
            items: [
              const DropdownMenuItem<String>(
                value: null,
                child: Text('Todas as carteiras'),
              ),
              ...wallets.map((wallet) => DropdownMenuItem(
                value: wallet.id,
                child: Text(wallet.name),
              )),
            ],
            onChanged: (value) => setState(() => _selectedWalletId = value),
          ),

          const SizedBox(height: 24),

          // Categoria
          const Text(
            'Categoria',
            style: TextStyle(fontSize: 14, color: Colors.white54, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _selectedCategory,
            dropdownColor: AppTheme.card,
            decoration: InputDecoration(
              filled: true,
              fillColor: AppTheme.background,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
            hint: const Text('Todas as categorias', style: TextStyle(color: Colors.white54)),
            style: const TextStyle(color: Colors.white),
            items: [
              const DropdownMenuItem<String>(
                value: null,
                child: Text('Todas as categorias'),
              ),
              ..._categories.map((cat) => DropdownMenuItem(
                value: cat,
                child: Text(cat),
              )),
            ],
            onChanged: (value) => setState(() => _selectedCategory = value),
          ),

          const SizedBox(height: 32),

          // Botões de Ação
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _clearFilters,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white24),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Limpar'),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: FilledButton(
                  onPressed: _applyFilters,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Aplicar Filtros'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildFilterChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    Color? color,
  }) {
    final activeColor = color ?? AppTheme.primary;
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? activeColor.withOpacity(0.2) : AppTheme.background,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? activeColor : Colors.transparent,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? activeColor : Colors.white54,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

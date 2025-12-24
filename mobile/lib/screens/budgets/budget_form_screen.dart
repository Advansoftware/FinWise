import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/providers/budget_provider.dart';

class BudgetFormScreen extends StatefulWidget {
  final BudgetModel? budget;

  const BudgetFormScreen({super.key, this.budget});

  @override
  State<BudgetFormScreen> createState() => _BudgetFormScreenState();
}

class _BudgetFormScreenState extends State<BudgetFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _amountController = TextEditingController();
  
  String _selectedCategory = 'Alimentação';
  String _selectedPeriod = 'monthly';
  bool _isLoading = false;

  final List<String> _categories = [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Educação',
    'Lazer',
    'Compras',
    'Serviços',
    'Outros',
  ];

  final Map<String, String> _periods = {
    'monthly': 'Mensal',
    'weekly': 'Semanal',
    'yearly': 'Anual',
  };

  bool get isEditing => widget.budget != null;

  @override
  void initState() {
    super.initState();
    if (widget.budget != null) {
      _nameController.text = widget.budget!.name ?? '';
      _amountController.text = widget.budget!.amount.toString();
      _selectedCategory = widget.budget!.category;
      _selectedPeriod = widget.budget!.period;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(isEditing ? 'Editar Orçamento' : 'Novo Orçamento'),
        backgroundColor: AppTheme.card,
        foregroundColor: AppTheme.textPrimary,
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Categoria
            const Text(
              'Categoria',
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppTheme.card,
                borderRadius: BorderRadius.circular(12),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedCategory,
                  isExpanded: true,
                  dropdownColor: AppTheme.card,
                  style: const TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 16,
                  ),
                  icon: const Icon(Icons.keyboard_arrow_down,
                      color: AppTheme.textSecondary),
                  items: _categories.map((category) {
                    return DropdownMenuItem(
                      value: category,
                      child: Row(
                        children: [
                          Icon(
                            _getCategoryIcon(category),
                            color: _getCategoryColor(category),
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Text(category),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _selectedCategory = value);
                    }
                  },
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Nome (opcional)
            const Text(
              'Nome (opcional)',
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _nameController,
              style: const TextStyle(color: AppTheme.textPrimary),
              decoration: InputDecoration(
                hintText: 'Ex: Orçamento de Janeiro',
                hintStyle: const TextStyle(color: AppTheme.textSecondary),
                filled: true,
                fillColor: AppTheme.card,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Valor
            const Text(
              'Valor Limite',
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _amountController,
              style: const TextStyle(color: AppTheme.textPrimary),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                prefixText: 'R\$ ',
                prefixStyle: const TextStyle(color: AppTheme.textPrimary),
                hintText: '0,00',
                hintStyle: const TextStyle(color: AppTheme.textSecondary),
                filled: true,
                fillColor: AppTheme.card,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Informe o valor';
                }
                final parsed = double.tryParse(value.replaceAll(',', '.'));
                if (parsed == null || parsed <= 0) {
                  return 'Valor inválido';
                }
                return null;
              },
            ),

            const SizedBox(height: 20),

            // Período
            const Text(
              'Período',
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppTheme.card,
                borderRadius: BorderRadius.circular(12),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedPeriod,
                  isExpanded: true,
                  dropdownColor: AppTheme.card,
                  style: const TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 16,
                  ),
                  icon: const Icon(Icons.keyboard_arrow_down,
                      color: AppTheme.textSecondary),
                  items: _periods.entries.map((entry) {
                    return DropdownMenuItem(
                      value: entry.key,
                      child: Text(entry.value),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _selectedPeriod = value);
                    }
                  },
                ),
              ),
            ),

            const SizedBox(height: 32),

            // Botão Salvar
            SizedBox(
              height: 52,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Text(
                        isEditing ? 'Salvar Alterações' : 'Criar Orçamento',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final provider = context.read<BudgetProvider>();
      final amount = double.parse(_amountController.text.replaceAll(',', '.'));

      final budget = BudgetModel(
        id: widget.budget?.id ?? '',
        category: _selectedCategory,
        name: _nameController.text.isEmpty ? null : _nameController.text,
        amount: amount,
        spent: widget.budget?.spent ?? 0,
        period: _selectedPeriod,
      );

      bool success;
      if (isEditing) {
        success = await provider.updateBudget(widget.budget!.id, budget);
      } else {
        success = await provider.createBudget(budget);
      }

      if (success && mounted) {
        Navigator.pop(context, true);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(provider.error ?? 'Erro ao salvar orçamento'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro: $e'),
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

  IconData _getCategoryIcon(String category) {
    final icons = {
      'Alimentação': Icons.restaurant,
      'Transporte': Icons.directions_car,
      'Moradia': Icons.home,
      'Saúde': Icons.medical_services,
      'Educação': Icons.school,
      'Lazer': Icons.sports_esports,
      'Compras': Icons.shopping_bag,
      'Serviços': Icons.build,
      'Outros': Icons.category,
    };
    return icons[category] ?? Icons.category;
  }

  Color _getCategoryColor(String category) {
    final colors = {
      'Alimentação': Colors.orange,
      'Transporte': Colors.blue,
      'Moradia': Colors.purple,
      'Saúde': Colors.red,
      'Educação': Colors.green,
      'Lazer': Colors.pink,
      'Compras': Colors.amber,
      'Serviços': Colors.teal,
      'Outros': Colors.grey,
    };
    return colors[category] ?? AppTheme.primary;
  }
}

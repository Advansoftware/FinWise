import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/providers/providers.dart';

class WalletFormScreen extends StatefulWidget {
  final WalletModel? wallet;

  const WalletFormScreen({super.key, this.wallet});

  static Future<bool?> show(BuildContext context, {WalletModel? wallet}) {
    return Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => WalletFormScreen(wallet: wallet),
      ),
    );
  }

  @override
  State<WalletFormScreen> createState() => _WalletFormScreenState();
}

class _WalletFormScreenState extends State<WalletFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _balanceController = TextEditingController();
  
  WalletType _selectedType = WalletType.checking;
  String _selectedColor = '#8B5CF6';
  bool _isLoading = false;

  bool get isEditing => widget.wallet != null;

  final List<WalletType> _walletTypes = [
    WalletType.cash,
    WalletType.checking,
    WalletType.savings,
    WalletType.creditCard,
    WalletType.investment,
    WalletType.other,
  ];

  final List<String> _colors = [
    '#8B5CF6', // Roxo (primary)
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Amarelo
    '#EF4444', // Vermelho
    '#EC4899', // Rosa
    '#6366F1', // Indigo
    '#14B8A6', // Teal
  ];

  @override
  void initState() {
    super.initState();
    if (widget.wallet != null) {
      _nameController.text = widget.wallet!.name;
      _balanceController.text = widget.wallet!.balance.toStringAsFixed(2);
      _selectedType = widget.wallet!.type;
      _selectedColor = widget.wallet!.color ?? '#8B5CF6';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _balanceController.dispose();
    super.dispose();
  }

  String _getTypeName(WalletType type) {
    switch (type) {
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

  IconData _getTypeIcon(WalletType type) {
    switch (type) {
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

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final walletProvider = context.read<WalletProvider>();
    
    final wallet = WalletModel(
      id: widget.wallet?.id ?? '',
      name: _nameController.text.trim(),
      type: _selectedType,
      balance: double.tryParse(_balanceController.text.replaceAll(',', '.')) ?? 0,
      color: _selectedColor,
      icon: _getTypeIcon(_selectedType).codePoint.toString(),
      isArchived: widget.wallet?.isArchived ?? false,
    );

    bool success;
    if (isEditing) {
      success = await walletProvider.updateWallet(widget.wallet!.id, wallet);
    } else {
      success = await walletProvider.addWallet(wallet);
    }

    setState(() => _isLoading = false);

    if (success && mounted) {
      Navigator.pop(context, true);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(walletProvider.error ?? 'Erro ao salvar carteira'),
          backgroundColor: AppTheme.error,
        ),
      );
    }
  }

  Future<void> _handleDelete() async {
    if (widget.wallet == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Excluir Carteira', style: TextStyle(color: Colors.white)),
        content: Text(
          'Tem certeza que deseja excluir "${widget.wallet!.name}"? Esta ação não pode ser desfeita.',
          style: TextStyle(color: Colors.white.withOpacity(0.7)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: AppTheme.error),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() => _isLoading = true);
      
      final success = await context.read<WalletProvider>().deleteWallet(widget.wallet!.id);
      
      setState(() => _isLoading = false);
      
      if (success && mounted) {
        Navigator.pop(context, true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(isEditing ? 'Editar Carteira' : 'Nova Carteira'),
        backgroundColor: AppTheme.background,
        elevation: 0,
        actions: [
          if (isEditing)
            IconButton(
              icon: const Icon(Icons.delete_outline, color: AppTheme.error),
              onPressed: _handleDelete,
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Nome
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: 'Nome da Carteira',
                hintText: 'Ex: Nubank, Itaú, Carteira...',
                filled: true,
                fillColor: AppTheme.card,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Digite o nome da carteira';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Tipo de carteira
            Text(
              'Tipo de Carteira',
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _walletTypes.map((type) {
                final isSelected = _selectedType == type;
                return ChoiceChip(
                  label: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _getTypeIcon(type),
                        size: 16,
                        color: isSelected ? Colors.white : Colors.white70,
                      ),
                      const SizedBox(width: 6),
                      Text(_getTypeName(type)),
                    ],
                  ),
                  selected: isSelected,
                  onSelected: (selected) {
                    if (selected) {
                      setState(() => _selectedType = type);
                    }
                  },
                  selectedColor: AppTheme.primary,
                  backgroundColor: AppTheme.card,
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : Colors.white70,
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            // Saldo
            TextFormField(
              controller: _balanceController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: 'Saldo Inicial',
                hintText: '0.00',
                prefixText: 'R\$ ',
                filled: true,
                fillColor: AppTheme.card,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Digite o saldo';
                }
                if (double.tryParse(value.replaceAll(',', '.')) == null) {
                  return 'Valor inválido';
                }
                return null;
              },
            ),
            const SizedBox(height: 20),

            // Cor
            Text(
              'Cor',
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: _colors.map((color) {
                final isSelected = _selectedColor == color;
                final colorValue = Color(int.parse(color.replaceFirst('#', '0xFF')));
                return GestureDetector(
                  onTap: () => setState(() => _selectedColor = color),
                  child: Container(
                    margin: const EdgeInsets.only(right: 12),
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: colorValue,
                      shape: BoxShape.circle,
                      border: isSelected
                          ? Border.all(color: Colors.white, width: 3)
                          : null,
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: colorValue.withOpacity(0.5),
                                blurRadius: 8,
                              )
                            ]
                          : null,
                    ),
                    child: isSelected
                        ? const Icon(Icons.check, color: Colors.white, size: 20)
                        : null,
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 32),

            // Botão salvar
            FilledButton(
              onPressed: _isLoading ? null : _handleSubmit,
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primary,
                minimumSize: const Size(double.infinity, 52),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      isEditing ? 'Salvar Alterações' : 'Criar Carteira',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

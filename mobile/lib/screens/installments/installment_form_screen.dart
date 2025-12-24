import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/providers/providers.dart';

class InstallmentFormScreen extends StatefulWidget {
  final InstallmentModel? installment;

  const InstallmentFormScreen({super.key, this.installment});

  static Future<bool?> show(BuildContext context, {InstallmentModel? installment}) {
    return Navigator.of(context).push<bool>(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            InstallmentFormScreen(installment: installment),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, 1),
              end: Offset.zero,
            ).animate(CurvedAnimation(
              parent: animation,
              curve: Curves.easeOutCubic,
            )),
            child: child,
          );
        },
        transitionDuration: const Duration(milliseconds: 300),
      ),
    );
  }

  @override
  State<InstallmentFormScreen> createState() => _InstallmentFormScreenState();
}

class _InstallmentFormScreenState extends State<InstallmentFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _totalAmountController = TextEditingController();
  final _installmentsController = TextEditingController();
  final _establishmentController = TextEditingController();

  String _selectedCategory = 'Outros';
  String? _selectedSubcategory;
  String? _selectedWalletId;
  DateTime _startDate = DateTime.now();
  bool _isLoading = false;

  bool get isEditing => widget.installment != null;

  final List<String> _categories = [
    'Supermercado',
    'Transporte',
    'Alimentação',
    'Entretenimento',
    'Saúde',
    'Educação',
    'Moradia',
    'Contas',
    'Lazer',
    'Vestuário',
    'Outros',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.installment != null) {
      final i = widget.installment!;
      _nameController.text = i.name;
      _descriptionController.text = i.description ?? '';
      _totalAmountController.text = i.totalAmount.toString();
      _installmentsController.text = i.totalInstallments.toString();
      _establishmentController.text = i.establishment ?? '';
      _selectedCategory = i.category;
      _selectedSubcategory = i.subcategory;
      _selectedWalletId = i.sourceWalletId;
      _startDate = i.startDate;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _totalAmountController.dispose();
    _installmentsController.dispose();
    _establishmentController.dispose();
    super.dispose();
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

    final totalAmount = double.tryParse(_totalAmountController.text) ?? 0;
    final totalInstallments = int.tryParse(_installmentsController.text) ?? 1;

    final installment = InstallmentModel(
      id: widget.installment?.id ?? '',
      name: _nameController.text.trim(),
      description: _descriptionController.text.trim().isEmpty
          ? null
          : _descriptionController.text.trim(),
      totalAmount: totalAmount,
      totalInstallments: totalInstallments,
      installmentAmount: totalAmount / totalInstallments,
      category: _selectedCategory,
      subcategory: _selectedSubcategory,
      establishment: _establishmentController.text.trim().isEmpty
          ? null
          : _establishmentController.text.trim(),
      startDate: _startDate,
      sourceWalletId: _selectedWalletId!,
    );

    final provider = context.read<InstallmentProvider>();
    bool success;

    if (isEditing) {
      success = await provider.updateInstallment(widget.installment!.id, installment);
    } else {
      success = await provider.createInstallment(installment);
    }

    setState(() => _isLoading = false);

    if (success && mounted) {
      Navigator.of(context).pop(true);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.error ?? 'Erro ao salvar')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final wallets = context.watch<WalletProvider>().wallets;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(isEditing ? 'Editar Parcelamento' : 'Novo Parcelamento'),
        backgroundColor: AppTheme.background,
        elevation: 0,
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
            // Nome
            _buildTextField(
              controller: _nameController,
              label: 'Nome do Parcelamento',
              hint: 'Ex: iPhone 15 Pro',
              validator: (v) =>
                  v?.isEmpty == true ? 'Informe o nome' : null,
            ),
            const SizedBox(height: 16),

            // Descrição
            _buildTextField(
              controller: _descriptionController,
              label: 'Descrição (opcional)',
              hint: 'Detalhes adicionais',
              maxLines: 2,
            ),
            const SizedBox(height: 16),

            // Valor total e parcelas
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    controller: _totalAmountController,
                    label: 'Valor Total',
                    hint: '0,00',
                    keyboardType: TextInputType.number,
                    prefix: 'R\$ ',
                    validator: (v) {
                      if (v?.isEmpty == true) return 'Informe o valor';
                      final amount = double.tryParse(v!);
                      if (amount == null || amount <= 0) return 'Valor inválido';
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildTextField(
                    controller: _installmentsController,
                    label: 'Nº Parcelas',
                    hint: '12',
                    keyboardType: TextInputType.number,
                    validator: (v) {
                      if (v?.isEmpty == true) return 'Informe';
                      final n = int.tryParse(v!);
                      if (n == null || n <= 0) return 'Inválido';
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Valor calculado da parcela
            if (_totalAmountController.text.isNotEmpty &&
                _installmentsController.text.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withAlpha(25),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Valor da Parcela:',
                      style: TextStyle(color: Colors.white70),
                    ),
                    Text(
                      'R\$ ${_calculateInstallmentAmount().toStringAsFixed(2)}',
                      style: const TextStyle(
                        color: AppTheme.primary,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 16),

            // Categoria
            _buildDropdown(
              label: 'Categoria',
              value: _selectedCategory,
              items: _categories,
              onChanged: (v) => setState(() {
                _selectedCategory = v!;
                _selectedSubcategory = null;
              }),
            ),
            const SizedBox(height: 16),

            // Estabelecimento
            _buildTextField(
              controller: _establishmentController,
              label: 'Estabelecimento (opcional)',
              hint: 'Onde foi a compra',
            ),
            const SizedBox(height: 16),

            // Carteira
            _buildDropdown(
              label: 'Carteira de Pagamento',
              value: _selectedWalletId,
              items: wallets.map((w) => w.id).toList(),
              itemLabels: wallets.map((w) => w.name).toList(),
              onChanged: (v) => setState(() => _selectedWalletId = v),
              hint: 'Selecione uma carteira',
            ),
            const SizedBox(height: 16),

            // Data de início
            _buildDatePicker(),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  double _calculateInstallmentAmount() {
    final total = double.tryParse(_totalAmountController.text) ?? 0;
    final installments = int.tryParse(_installmentsController.text) ?? 1;
    return installments > 0 ? total / installments : 0;
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    String? hint,
    String? prefix,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Colors.white70,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          style: const TextStyle(color: Colors.white),
          maxLines: maxLines,
          keyboardType: keyboardType,
          validator: validator,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.white.withAlpha(77)),
            prefixText: prefix,
            prefixStyle: const TextStyle(color: Colors.white),
            filled: true,
            fillColor: AppTheme.card,
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
              borderSide: const BorderSide(color: AppTheme.primary),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 12,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required String label,
    required String? value,
    required List<String> items,
    List<String>? itemLabels,
    required void Function(String?) onChanged,
    String? hint,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Colors.white70,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppTheme.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: items.contains(value) ? value : null,
              hint: Text(
                hint ?? 'Selecione',
                style: TextStyle(color: Colors.white.withAlpha(128)),
              ),
              isExpanded: true,
              dropdownColor: AppTheme.card,
              icon: const Icon(Icons.arrow_drop_down, color: Colors.white54),
              items: items.asMap().entries.map((entry) {
                final i = entry.key;
                final item = entry.value;
                final displayLabel = itemLabels != null && i < itemLabels.length
                    ? itemLabels[i]
                    : item;
                return DropdownMenuItem(
                  value: item,
                  child: Text(
                    displayLabel,
                    style: const TextStyle(color: Colors.white),
                  ),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDatePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Data de Início',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Colors.white70,
          ),
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: () async {
            final date = await showDatePicker(
              context: context,
              initialDate: _startDate,
              firstDate: DateTime(2020),
              lastDate: DateTime(2030),
              builder: (context, child) {
                return Theme(
                  data: Theme.of(context).copyWith(
                    colorScheme: const ColorScheme.dark(
                      primary: AppTheme.primary,
                      surface: AppTheme.card,
                    ),
                  ),
                  child: child!,
                );
              },
            );
            if (date != null) {
              setState(() => _startDate = date);
            }
          },
          borderRadius: BorderRadius.circular(10),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.card,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.border),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today, size: 20, color: Colors.white54),
                const SizedBox(width: 12),
                Text(
                  '${_startDate.day.toString().padLeft(2, '0')}/${_startDate.month.toString().padLeft(2, '0')}/${_startDate.year}',
                  style: const TextStyle(color: Colors.white),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

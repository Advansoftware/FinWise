import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/models.dart';
import '../../core/utils/format_utils.dart';
import '../../core/providers/goal_provider.dart';

class GoalFormScreen extends StatefulWidget {
  final GoalModel? goal;

  const GoalFormScreen({super.key, this.goal});

  @override
  State<GoalFormScreen> createState() => _GoalFormScreenState();
}

class _GoalFormScreenState extends State<GoalFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _targetAmountController = TextEditingController();
  final _currentAmountController = TextEditingController();
  final _monthlyDepositController = TextEditingController();

  DateTime? _targetDate;
  bool _isLoading = false;

  bool get isEditing => widget.goal != null;

  @override
  void initState() {
    super.initState();
    if (widget.goal != null) {
      _nameController.text = widget.goal!.name;
      _targetAmountController.text = widget.goal!.targetAmount.toString();
      _currentAmountController.text = widget.goal!.currentAmount.toString();
      if (widget.goal!.monthlyDeposit != null) {
        _monthlyDepositController.text =
            widget.goal!.monthlyDeposit.toString();
      }
      _targetDate = widget.goal!.targetDate;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _targetAmountController.dispose();
    _currentAmountController.dispose();
    _monthlyDepositController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(isEditing ? 'Editar Meta' : 'Nova Meta'),
        backgroundColor: AppTheme.card,
        foregroundColor: AppTheme.textPrimary,
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Ícone
            Center(
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withAlpha(51),
                  borderRadius: BorderRadius.circular(40),
                ),
                child: const Icon(
                  Icons.flag,
                  size: 40,
                  color: AppTheme.primary,
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Nome
            const Text(
              'Nome da Meta',
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
                hintText: 'Ex: Viagem para Europa',
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
                  return 'Informe o nome da meta';
                }
                return null;
              },
            ),

            const SizedBox(height: 20),

            // Valor Alvo
            const Text(
              'Valor Objetivo',
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _targetAmountController,
              style: const TextStyle(color: AppTheme.textPrimary),
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
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
                  return 'Informe o valor objetivo';
                }
                final parsed = double.tryParse(value.replaceAll(',', '.'));
                if (parsed == null || parsed <= 0) {
                  return 'Valor inválido';
                }
                return null;
              },
            ),

            const SizedBox(height: 20),

            // Valor Atual
            const Text(
              'Valor Já Guardado (opcional)',
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _currentAmountController,
              style: const TextStyle(color: AppTheme.textPrimary),
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
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
            ),

            const SizedBox(height: 20),

            // Depósito Mensal
            const Text(
              'Depósito Mensal Planejado (opcional)',
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _monthlyDepositController,
              style: const TextStyle(color: AppTheme.textPrimary),
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
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
            ),

            const SizedBox(height: 20),

            // Data Alvo
            const Text(
              'Data Objetivo (opcional)',
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            InkWell(
              onTap: _selectTargetDate,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 16,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.calendar_today,
                      color: AppTheme.textSecondary,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      _targetDate != null
                          ? FormatUtils.formatDate(_targetDate!)
                          : 'Selecionar data',
                      style: TextStyle(
                        color: _targetDate != null
                            ? AppTheme.textPrimary
                            : AppTheme.textSecondary,
                        fontSize: 16,
                      ),
                    ),
                    const Spacer(),
                    if (_targetDate != null)
                      IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        color: AppTheme.textSecondary,
                        onPressed: () {
                          setState(() => _targetDate = null);
                        },
                      ),
                  ],
                ),
              ),
            ),

            // Estimativa
            if (_targetDate != null && _monthlyDepositController.text.isNotEmpty)
              _buildEstimate(),

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
                        isEditing ? 'Salvar Alterações' : 'Criar Meta',
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

  Widget _buildEstimate() {
    final targetAmount =
        double.tryParse(_targetAmountController.text.replaceAll(',', '.')) ?? 0;
    final currentAmount =
        double.tryParse(_currentAmountController.text.replaceAll(',', '.')) ??
            0;
    final monthlyDeposit =
        double.tryParse(_monthlyDepositController.text.replaceAll(',', '.')) ??
            0;

    if (monthlyDeposit <= 0) return const SizedBox.shrink();

    final remaining = targetAmount - currentAmount;
    final monthsNeeded = (remaining / monthlyDeposit).ceil();
    final estimatedDate =
        DateTime.now().add(Duration(days: monthsNeeded * 30));

    final willReachInTime = _targetDate != null && 
        estimatedDate.isBefore(_targetDate!) || 
        estimatedDate.isAtSameMomentAs(_targetDate!);

    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: (willReachInTime ? AppTheme.success : AppTheme.warning)
            .withAlpha(51),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(
            willReachInTime ? Icons.check_circle : Icons.info_outline,
            color: willReachInTime ? AppTheme.success : AppTheme.warning,
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  willReachInTime
                      ? 'Você atingirá a meta no prazo!'
                      : 'Você precisará de mais tempo',
                  style: TextStyle(
                    color: willReachInTime ? AppTheme.success : AppTheme.warning,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Com R\$ ${monthlyDeposit.toStringAsFixed(2)}/mês, você atingirá em $monthsNeeded meses (${FormatUtils.formatDate(estimatedDate)})',
                  style: TextStyle(
                    color: willReachInTime ? AppTheme.success : AppTheme.warning,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _selectTargetDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _targetDate ?? DateTime.now().add(const Duration(days: 365)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 10)),
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

    if (picked != null) {
      setState(() => _targetDate = picked);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final provider = context.read<GoalProvider>();
      final targetAmount =
          double.parse(_targetAmountController.text.replaceAll(',', '.'));
      final currentAmount =
          double.tryParse(_currentAmountController.text.replaceAll(',', '.')) ??
              0;
      final monthlyDeposit = double.tryParse(
          _monthlyDepositController.text.replaceAll(',', '.'));

      final goal = GoalModel(
        id: widget.goal?.id ?? '',
        name: _nameController.text,
        targetAmount: targetAmount,
        currentAmount: currentAmount,
        monthlyDeposit: monthlyDeposit,
        targetDate: _targetDate,
      );

      bool success;
      if (isEditing) {
        success = await provider.updateGoal(widget.goal!.id, goal);
      } else {
        success = await provider.createGoal(goal);
      }

      if (success && mounted) {
        Navigator.pop(context, true);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(provider.error ?? 'Erro ao salvar meta'),
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
}

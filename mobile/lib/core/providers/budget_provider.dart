import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/services.dart';

/// Provider para gerenciamento de orçamentos
class BudgetProvider extends ChangeNotifier {
  final BudgetService _budgetService = BudgetService();

  List<BudgetModel> _budgets = [];
  bool _isLoading = false;
  String? _error;

  List<BudgetModel> get budgets => _budgets;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Resumo dos orçamentos
  BudgetSummary get summary {
    double totalBudget = 0;
    double totalSpent = 0;
    int overBudgetCount = 0;
    int onTrackCount = 0;

    for (final budget in _budgets) {
      totalBudget += budget.amount;
      totalSpent += budget.spent;

      if (budget.percentUsed > 100) {
        overBudgetCount++;
      } else {
        onTrackCount++;
      }
    }

    return BudgetSummary(
      totalBudget: totalBudget,
      totalSpent: totalSpent,
      remaining: totalBudget - totalSpent,
      overBudgetCount: overBudgetCount,
      onTrackCount: onTrackCount,
      totalCount: _budgets.length,
    );
  }

  /// Carrega os orçamentos
  Future<void> loadBudgets({int? month, int? year}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _budgetService.getBudgets(
        month: month,
        year: year,
      );

      if (result.isSuccess && result.data != null) {
        _budgets = result.data!;
      } else {
        _error = result.error ?? 'Erro ao carregar orçamentos';
      }
    } catch (e) {
      _error = 'Erro ao carregar orçamentos: $e';
      debugPrint(_error);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Cria um novo orçamento
  Future<bool> createBudget(BudgetModel budget) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await _budgetService.createBudget(budget);

      if (result.isSuccess && result.data != null) {
        _budgets.insert(0, result.data!);
        notifyListeners();
        return true;
      }
      
      _error = result.error;
      return false;
    } catch (e) {
      _error = 'Erro ao criar orçamento: $e';
      debugPrint(_error);
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Atualiza um orçamento
  Future<bool> updateBudget(String id, BudgetModel budget) async {
    try {
      final result = await _budgetService.updateBudget(id, budget);

      if (result.isSuccess && result.data != null) {
        final index = _budgets.indexWhere((b) => b.id == id);
        if (index >= 0) {
          _budgets[index] = result.data!;
          notifyListeners();
        }
        return true;
      }
      
      _error = result.error;
      return false;
    } catch (e) {
      _error = 'Erro ao atualizar orçamento: $e';
      debugPrint(_error);
      return false;
    }
  }

  /// Deleta um orçamento
  Future<bool> deleteBudget(String id) async {
    try {
      final result = await _budgetService.deleteBudget(id);

      if (result.isSuccess) {
        _budgets.removeWhere((b) => b.id == id);
        notifyListeners();
        return true;
      }
      
      _error = result.error;
      return false;
    } catch (e) {
      _error = 'Erro ao deletar orçamento: $e';
      debugPrint(_error);
      return false;
    }
  }

  /// Limpa erros
  void clearError() {
    _error = null;
    notifyListeners();
  }
}

/// Resumo dos orçamentos
class BudgetSummary {
  final double totalBudget;
  final double totalSpent;
  final double remaining;
  final int overBudgetCount;
  final int onTrackCount;
  final int totalCount;

  const BudgetSummary({
    required this.totalBudget,
    required this.totalSpent,
    required this.remaining,
    required this.overBudgetCount,
    required this.onTrackCount,
    required this.totalCount,
  });

  double get usagePercentage =>
      totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
}

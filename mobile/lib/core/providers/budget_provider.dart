import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/services.dart';

/// Provider para gerenciamento de orçamentos com suporte offline-first
class BudgetProvider extends ChangeNotifier {
  final BudgetService _budgetService = BudgetService();
  late final LocalStorageService _localStorage;

  List<BudgetModel> _budgets = [];
  bool _isLoading = false;
  bool _isRefreshing = false;
  String? _error;
  bool _isOfflineMode = false;

  List<BudgetModel> get budgets => _budgets;
  bool get isLoading => _isLoading;
  bool get isRefreshing => _isRefreshing;
  String? get error => _error;
  bool get isOfflineMode => _isOfflineMode;

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
      overBudgetCount: overBudgetCount,
      onTrackCount: onTrackCount,
    );
  }

  BudgetProvider() {
    _localStorage = LocalStorageService();
    _initOfflineSupport();
  }

  Future<void> _initOfflineSupport() async {
    await _localStorage.init();
    // Carrega orçamentos do cache local primeiro (instantâneo)
    final cached = await _localStorage.getCachedBudgets();
    if (cached.isNotEmpty) {
      _budgets = cached;
      notifyListeners();
    }
  }

  /// Carrega os orçamentos - offline first
  Future<void> loadBudgets({int? month, int? year}) async {
    // Se não temos dados, mostra loading
    if (_budgets.isEmpty) {
      _isLoading = true;
      _error = null;
      notifyListeners();
    } else {
      // Se já temos dados do cache, mostra refresh indicator sutil
      _isRefreshing = true;
      notifyListeners();
    }

    try {
      final result = await _budgetService.getBudgets(
        month: month,
        year: year,
      );

      if (result.isSuccess && result.data != null) {
        _budgets = result.data!;
        _isOfflineMode = false;
        
        // Salva no cache local
        await _localStorage.cacheBudgets(_budgets);
      } else {
        // Fallback para cache local se offline
        if (_budgets.isEmpty) {
          final cached = await _localStorage.getCachedBudgets();
          if (cached.isNotEmpty) {
            _budgets = cached;
            _isOfflineMode = true;
            _error = null;
          } else {
            _error = result.error ?? 'Erro ao carregar orçamentos';
          }
        } else {
          _isOfflineMode = true;
        }
      }
    } catch (e) {
      if (_budgets.isEmpty) {
        _error = 'Erro ao carregar orçamentos: $e';
      }
      _isOfflineMode = true;
      debugPrint(_error);
    } finally {
      _isLoading = false;
      _isRefreshing = false;
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
        
        // Atualiza cache
        await _localStorage.cacheBudgets(_budgets);
        
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
          
          // Atualiza cache
          await _localStorage.cacheBudgets(_budgets);
          
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
        
        // Atualiza cache
        await _localStorage.cacheBudgets(_budgets);
        
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

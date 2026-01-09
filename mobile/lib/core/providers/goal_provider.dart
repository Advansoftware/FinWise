import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/services.dart';

/// Provider para gerenciamento de metas financeiras com suporte offline-first
class GoalProvider extends ChangeNotifier {
  final GoalService _goalService = GoalService();
  late final LocalStorageService _localStorage;

  List<GoalModel> _goals = [];
  bool _isLoading = false;
  bool _isRefreshing = false;
  String? _error;
  bool _isOfflineMode = false;

  List<GoalModel> get goals => _goals;
  bool get isLoading => _isLoading;
  bool get isRefreshing => _isRefreshing;
  String? get error => _error;
  bool get isOfflineMode => _isOfflineMode;

  // Metas ativas (não concluídas)
  List<GoalModel> get activeGoals =>
      _goals.where((g) => g.currentAmount < g.targetAmount).toList();

  // Metas concluídas
  List<GoalModel> get completedGoals =>
      _goals.where((g) => g.currentAmount >= g.targetAmount).toList();

  // Resumo das metas
  GoalsSummary get summary {
    double totalTarget = 0;
    double totalCurrent = 0;

    for (final goal in _goals) {
      totalTarget += goal.targetAmount;
      totalCurrent += goal.currentAmount;
    }

    return GoalsSummary(
      totalTarget: totalTarget,
      totalCurrent: totalCurrent,
    );
  }

  GoalProvider() {
    _localStorage = LocalStorageService();
    _initOfflineSupport();
  }

  Future<void> _initOfflineSupport() async {
    await _localStorage.init();
    // Carrega metas do cache local primeiro (instantâneo)
    final cached = await _localStorage.getCachedGoals();
    if (cached.isNotEmpty) {
      _goals = cached;
      notifyListeners();
    }
  }

  /// Carrega as metas - offline first
  Future<void> loadGoals({bool activeOnly = false}) async {
    // Se não temos dados, mostra loading
    if (_goals.isEmpty) {
      _isLoading = true;
      _error = null;
      notifyListeners();
    } else {
      // Se já temos dados do cache, mostra refresh indicator sutil
      _isRefreshing = true;
      notifyListeners();
    }

    try {
      final result = await _goalService.getGoals(activeOnly: activeOnly);

      if (result.isSuccess && result.data != null) {
        _goals = result.data!;
        _isOfflineMode = false;
        
        // Salva no cache local
        await _localStorage.cacheGoals(_goals);
      } else {
        // Fallback para cache local se offline
        if (_goals.isEmpty) {
          final cached = await _localStorage.getCachedGoals();
          if (cached.isNotEmpty) {
            _goals = cached;
            _isOfflineMode = true;
            _error = null;
          } else {
            _error = result.error ?? 'Erro ao carregar metas';
          }
        } else {
          _isOfflineMode = true;
        }
      }
    } catch (e) {
      if (_goals.isEmpty) {
        _error = 'Erro ao carregar metas: $e';
      }
      _isOfflineMode = true;
      debugPrint(_error);
    } finally {
      _isLoading = false;
      _isRefreshing = false;
      notifyListeners();
    }
  }

  /// Cria uma nova meta
  Future<bool> createGoal(GoalModel goal) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await _goalService.createGoal(goal);

      if (result.isSuccess && result.data != null) {
        _goals.insert(0, result.data!);
        
        // Atualiza cache
        await _localStorage.cacheGoals(_goals);
        
        notifyListeners();
        return true;
      }

      _error = result.error;
      return false;
    } catch (e) {
      _error = 'Erro ao criar meta: $e';
      debugPrint(_error);
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Atualiza uma meta
  Future<bool> updateGoal(String id, GoalModel goal) async {
    try {
      final result = await _goalService.updateGoal(id, goal);

      if (result.isSuccess && result.data != null) {
        final index = _goals.indexWhere((g) => g.id == id);
        if (index >= 0) {
          _goals[index] = result.data!;
          
          // Atualiza cache
          await _localStorage.cacheGoals(_goals);
          
          notifyListeners();
        }
        return true;
      }

      _error = result.error;
      return false;
    } catch (e) {
      _error = 'Erro ao atualizar meta: $e';
      debugPrint(_error);
      return false;
    }
  }

  /// Adiciona valor a uma meta
  Future<bool> addToGoal(String id, double amount) async {
    try {
      final result = await _goalService.addToGoal(id, amount);

      if (result.isSuccess && result.data != null) {
        final index = _goals.indexWhere((g) => g.id == id);
        if (index >= 0) {
          _goals[index] = result.data!;
          
          // Atualiza cache
          await _localStorage.cacheGoals(_goals);
          
          notifyListeners();
        }
        return true;
      }

      _error = result.error;
      return false;
    } catch (e) {
      _error = 'Erro ao adicionar valor: $e';
      debugPrint(_error);
      return false;
    }
  }

  /// Deleta uma meta
  Future<bool> deleteGoal(String id) async {
    try {
      final result = await _goalService.deleteGoal(id);

      if (result.isSuccess) {
        _goals.removeWhere((g) => g.id == id);
        
        // Atualiza cache
        await _localStorage.cacheGoals(_goals);
        
        notifyListeners();
        return true;
      }

      _error = result.error;
      return false;
    } catch (e) {
      _error = 'Erro ao deletar meta: $e';
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
